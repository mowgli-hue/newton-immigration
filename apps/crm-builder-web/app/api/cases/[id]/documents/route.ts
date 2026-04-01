import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase } from "@/lib/rbac";
import { maybeAutoRunImm5710 } from "@/lib/imm5710-runner";
import { buildReadyPackage, writeReadyPackageToDisk } from "@/lib/ready-package";
import {
  addAuditLog,
  addDocument,
  fulfillCaseDocRequest,
  getCase,
  listDocuments,
  resolveCaseDriveRootLink,
  syncCaseAutomation,
  updateCaseImm5710Automation,
  updateCaseLinks
} from "@/lib/store";
import {
  buildCaseFolderNameWithApp,
  createCaseDriveStructure,
  extractDriveFolderId,
  getOrCreateDriveSubfolder,
  uploadFileToDriveFolder
} from "@/lib/google-drive";
import {
  buildS3ObjectKey,
  fromS3StoredLink,
  getSignedDownloadUrl,
  isS3StorageEnabled,
  isS3StoredLink,
  putObjectToS3,
  toS3StoredLink
} from "@/lib/object-storage";
import { runAiIntakeCheckAndCreateTasks } from "@/lib/ai-intake-automation";

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(0, 120) || "document.bin";
}

function isPdfFile(file: File): boolean {
  const mime = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  return mime === "application/pdf" || name.endsWith(".pdf");
}

async function ensureCaseDriveFolders(companyId: string, caseId: string) {
  const caseItem = await getCase(companyId, caseId);
  if (!caseItem) return { created: false, skipped: "case_not_found" as const };

  if (
    caseItem.applicationFormsLink &&
    caseItem.submittedFolderLink &&
    caseItem.correspondenceFolderLink
  ) {
    return { created: false, skipped: "already_exists" as const };
  }

  const choice = await resolveCaseDriveRootLink(companyId, caseItem.id);
  const driveRoot = String(choice.link || "").trim();
  if (!driveRoot) return { created: false, skipped: "drive_root_missing" as const };

  const rootId = extractDriveFolderId(driveRoot);
  if (!rootId) return { created: false, skipped: "drive_root_invalid" as const };

  const structure = await createCaseDriveStructure(
    rootId,
    buildCaseFolderNameWithApp(caseItem.id, caseItem.client, caseItem.formType)
  );
  await updateCaseLinks(companyId, caseItem.id, {
    docsUploadLink: structure.subfolders.clientDocuments.webViewLink,
    applicationFormsLink: structure.subfolders.applicationForms.webViewLink,
    submittedFolderLink: structure.subfolders.submitted.webViewLink,
    correspondenceFolderLink: structure.subfolders.correspondence.webViewLink
  });
  return { created: true as const, folderLink: structure.caseFolder.webViewLink };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (user.userType === "client" && user.caseId !== caseItem.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.userType === "staff" && !canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const documentsRaw = await listDocuments(user.companyId, params.id);
  const documents = await Promise.all(
    documentsRaw.map(async (d) => {
      if (!isS3StoredLink(d.link)) return d;
      try {
        const key = fromS3StoredLink(d.link);
        if (!key) return d;
        const signedUrl = await getSignedDownloadUrl({
          key,
          expiresInSeconds: Number(process.env.S3_SIGNED_URL_EXPIRES || 300)
        });
        return { ...d, link: signedUrl };
      } catch {
        return d;
      }
    })
  );
  await addAuditLog({
    companyId: user.companyId,
    actorUserId: user.id,
    actorName: user.name,
    action: "documents.list",
    resourceType: "case",
    resourceId: params.id,
    metadata: {
      count: String(documents.length),
      userType: user.userType
    }
  });
  return NextResponse.json({ documents });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (user.userType === "client" && user.caseId !== caseItem.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.userType === "staff" && !canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const maybeFile = formData.get("file");
    const customName = String(formData.get("name") ?? "").trim();
    const categoryRaw = String(formData.get("category") ?? "").trim().toLowerCase();
    const category = categoryRaw === "result" ? "result" : "general";
    const driveFolderTypeRaw = String(formData.get("driveFolderType") ?? "")
      .trim()
      .toLowerCase();
    const driveFolderType =
      driveFolderTypeRaw === "submission" || driveFolderTypeRaw === "results"
        ? driveFolderTypeRaw
        : "default";
    const requestId = String(formData.get("requestId") ?? "").trim();

    if (!(maybeFile instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (maybeFile.size <= 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }
    if (maybeFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 25MB)." }, { status: 400 });
    }
    if ((driveFolderType === "submission" || driveFolderType === "results") && !isPdfFile(maybeFile)) {
      return NextResponse.json(
        { error: "Only PDF files are allowed for submission/results uploads." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await maybeFile.arrayBuffer());
    const original = sanitizeFilename(maybeFile.name || "document.bin");
    const finalName = `${Date.now()}_${original}`;
    let finalLink = "";
    if (isS3StorageEnabled()) {
      const key = buildS3ObjectKey({
        companyId: user.companyId,
        caseId: params.id,
        fileName: finalName
      });
      try {
        await putObjectToS3({
          key,
          content: buffer,
          contentType: maybeFile.type || "application/octet-stream"
        });
        finalLink = toS3StoredLink(key);
      } catch (error) {
        return NextResponse.json(
          { error: `S3 upload failed: ${(error as Error).message}` },
          { status: 500 }
        );
      }
    } else {
      const caseFolder = join(process.cwd(), "public", "uploads", "cases", params.id);
      await mkdir(caseFolder, { recursive: true });
      const savePath = join(caseFolder, finalName);
      await writeFile(savePath, buffer);
      finalLink = `/uploads/cases/${params.id}/${finalName}`;
    }

    let driveUpload: { success: boolean; reason?: string; error?: string; link?: string } = {
      success: false,
      reason: "not_attempted"
    };
    let targetCase = caseItem;
    const needsStructure =
      !targetCase.applicationFormsLink ||
      !targetCase.submittedFolderLink ||
      !targetCase.correspondenceFolderLink ||
      !targetCase.docsUploadLink;
    if (needsStructure) {
      try {
        await ensureCaseDriveFolders(user.companyId, params.id);
        const refreshed = await getCase(user.companyId, params.id);
        if (refreshed) targetCase = refreshed;
      } catch {
        // Keep local upload working even if Drive folder setup fails.
        driveUpload = { success: false, reason: "drive_folder_setup_failed" };
      }
    }
    let driveFolderId = extractDriveFolderId(targetCase.docsUploadLink || "");
    const submittedFolderId = extractDriveFolderId(targetCase.submittedFolderLink || "");
    if (submittedFolderId && (driveFolderType === "submission" || driveFolderType === "results")) {
      try {
        const subfolderName = driveFolderType === "submission" ? "Submission" : "Results";
        const folder = await getOrCreateDriveSubfolder(submittedFolderId, subfolderName);
        driveFolderId = folder.id;
      } catch {
        // fallback to default docs folder
      }
    }
    if (driveFolderId) {
      try {
        const driveFile = await uploadFileToDriveFolder({
          folderId: driveFolderId,
          fileName: maybeFile.name || finalName,
          fileBuffer: buffer,
          mimeType: maybeFile.type || "application/octet-stream"
        });
        // Keep primary secure storage link (S3/local) in database and only mark Drive mirror status.
        driveUpload = { success: true, link: driveFile.webViewLink };
      } catch {
        // Keep local public link as fallback.
        driveUpload = { success: false, reason: "drive_upload_failed" };
      }
    } else if (!driveUpload.success) {
      driveUpload = { success: false, reason: "drive_folder_missing" };
    }

    const doc = await addDocument({
      companyId: user.companyId,
      caseId: params.id,
      name: customName || maybeFile.name || finalName,
      category,
      link: finalLink,
      status: "received"
    });
    await addAuditLog({
      companyId: user.companyId,
      actorUserId: user.id,
      actorName: user.name,
      action: "document.upload",
      resourceType: "document",
      resourceId: doc.id,
      metadata: {
        caseId: params.id,
        category,
        driveFolderType,
        name: doc.name
      }
    });
    if (requestId) {
      await fulfillCaseDocRequest({
        companyId: user.companyId,
        caseId: params.id,
        requestId,
        fulfilledBy: user.name,
        documentId: doc.id
      });
    }
    const synced = await syncCaseAutomation(user.companyId, params.id);
    let automation: { started: boolean; skippedReason?: string; error?: string } | null = null;
    let readyPackagePath = "";
    let drive: { created: boolean; skipped?: string; error?: string; folderLink?: string } | null = null;
    if (synced) {
      const allDocs = await listDocuments(user.companyId, params.id);
      const snapshot = buildReadyPackage(synced, allDocs);
      if (snapshot.readyPackage.readiness.readyForHumanReview) {
        try {
          drive = await ensureCaseDriveFolders(user.companyId, synced.id);
        } catch (error) {
          drive = { created: false, error: (error as Error).message };
        }
        readyPackagePath = await writeReadyPackageToDisk(synced.id, snapshot.readyPackage);
        const run = maybeAutoRunImm5710(synced, readyPackagePath);
        automation = run;
        if (run.started) {
          await updateCaseImm5710Automation(user.companyId, synced.id, {
            status: "started",
            startedAt: new Date().toISOString(),
            pid: run.pid,
            logPath: run.logPath,
            readyPackagePath,
            autoTriggered: true,
            lastError: undefined
          });
        } else if (run.error) {
          await updateCaseImm5710Automation(user.companyId, synced.id, {
            status: "failed",
            readyPackagePath,
            lastError: run.error,
            autoTriggered: true
          });
        }
      }
    }

    const autoIntake = await runAiIntakeCheckAndCreateTasks({
      companyId: user.companyId,
      caseId: params.id,
      actorUserId: user.id,
      actorName: user.name,
      maxTasks: Number(process.env.AI_INTAKE_AUTO_TASKS_MAX || 8),
      auditAction: "case.ai.intake_check.auto_from_document"
    }).catch(() => null);

    return NextResponse.json({ document: doc, driveUpload, readyPackagePath, automation, drive, autoIntakeCheck: autoIntake }, { status: 201 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const link = String(body.link ?? "").trim();
  const categoryRaw = String(body.category ?? "").trim().toLowerCase();
  const category = categoryRaw === "result" ? "result" : "general";
  const status = String(body.status ?? "pending") as "pending" | "received";
  const requestId = String(body.requestId ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const doc = await addDocument({
    companyId: user.companyId,
    caseId: params.id,
    name,
    category,
    link,
    status
  });
  await addAuditLog({
    companyId: user.companyId,
    actorUserId: user.id,
    actorName: user.name,
    action: "document.add_link",
    resourceType: "document",
    resourceId: doc.id,
    metadata: {
      caseId: params.id,
      category,
      name: doc.name
    }
  });
  if (requestId) {
    await fulfillCaseDocRequest({
      companyId: user.companyId,
      caseId: params.id,
      requestId,
      fulfilledBy: user.name,
      documentId: doc.id
    });
  }
  const synced = await syncCaseAutomation(user.companyId, params.id);
  let automation: { started: boolean; skippedReason?: string; error?: string } | null = null;
  let readyPackagePath = "";
  let drive: { created: boolean; skipped?: string; error?: string; folderLink?: string } | null = null;
  if (synced) {
    const allDocs = await listDocuments(user.companyId, params.id);
    const snapshot = buildReadyPackage(synced, allDocs);
    if (snapshot.readyPackage.readiness.readyForHumanReview) {
      try {
        drive = await ensureCaseDriveFolders(user.companyId, synced.id);
      } catch (error) {
        drive = { created: false, error: (error as Error).message };
      }
      readyPackagePath = await writeReadyPackageToDisk(synced.id, snapshot.readyPackage);
      const run = maybeAutoRunImm5710(synced, readyPackagePath);
      automation = run;
      if (run.started) {
        await updateCaseImm5710Automation(user.companyId, synced.id, {
          status: "started",
          startedAt: new Date().toISOString(),
          pid: run.pid,
          logPath: run.logPath,
          readyPackagePath,
          autoTriggered: true,
          lastError: undefined
        });
      } else if (run.error) {
        await updateCaseImm5710Automation(user.companyId, synced.id, {
          status: "failed",
          readyPackagePath,
          lastError: run.error,
          autoTriggered: true
        });
      }
    }
  }

  const autoIntake = await runAiIntakeCheckAndCreateTasks({
    companyId: user.companyId,
    caseId: params.id,
    actorUserId: user.id,
    actorName: user.name,
    maxTasks: Number(process.env.AI_INTAKE_AUTO_TASKS_MAX || 8),
    auditAction: "case.ai.intake_check.auto_from_document"
  }).catch(() => null);

  return NextResponse.json({ document: doc, readyPackagePath, automation, drive, autoIntakeCheck: autoIntake }, { status: 201 });
}
