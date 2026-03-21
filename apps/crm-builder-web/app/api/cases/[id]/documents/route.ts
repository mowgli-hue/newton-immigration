import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { maybeAutoRunImm5710 } from "@/lib/imm5710-runner";
import { buildReadyPackage, writeReadyPackageToDisk } from "@/lib/ready-package";
import {
  addDocument,
  fulfillCaseDocRequest,
  findCompanyById,
  getCase,
  listDocuments,
  syncCaseAutomation,
  updateCaseImm5710Automation,
  updateCaseLinks
} from "@/lib/store";
import {
  buildCaseFolderNameWithApp,
  createCaseDriveStructure,
  extractDriveFolderId,
  uploadFileToDriveFolder
} from "@/lib/google-drive";

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(0, 120) || "document.bin";
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

  const company = await findCompanyById(companyId);
  const driveRoot = String(company?.branding?.driveRootLink || "").trim();
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

  const documents = await listDocuments(user.companyId, params.id);
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

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const maybeFile = formData.get("file");
    const customName = String(formData.get("name") ?? "").trim();
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

    const original = sanitizeFilename(maybeFile.name || "document.bin");
    const finalName = `${Date.now()}_${original}`;
    const caseFolder = join(process.cwd(), "public", "uploads", "cases", params.id);
    await mkdir(caseFolder, { recursive: true });
    const savePath = join(caseFolder, finalName);
    const buffer = Buffer.from(await maybeFile.arrayBuffer());
    await writeFile(savePath, buffer);

    const publicLink = `/uploads/cases/${params.id}/${finalName}`;
    let finalLink = publicLink;
    let driveUpload: { success: boolean; reason?: string; error?: string; link?: string } = {
      success: false,
      reason: "not_attempted"
    };
    let targetCase = caseItem;
    if (!extractDriveFolderId(caseItem.docsUploadLink || "")) {
      try {
        await ensureCaseDriveFolders(user.companyId, params.id);
        const refreshed = await getCase(user.companyId, params.id);
        if (refreshed) targetCase = refreshed;
      } catch {
        // Keep local upload working even if Drive folder setup fails.
        driveUpload = { success: false, reason: "drive_folder_setup_failed" };
      }
    }
    const driveFolderId = extractDriveFolderId(targetCase.docsUploadLink || "");
    if (driveFolderId) {
      try {
        const driveFile = await uploadFileToDriveFolder({
          folderId: driveFolderId,
          fileName: maybeFile.name || finalName,
          fileBuffer: buffer,
          mimeType: maybeFile.type || "application/octet-stream"
        });
        finalLink = driveFile.webViewLink;
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
      link: finalLink,
      status: "received"
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

    return NextResponse.json({ document: doc, driveUpload, readyPackagePath, automation, drive }, { status: 201 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const link = String(body.link ?? "").trim();
  const status = String(body.status ?? "pending") as "pending" | "received";
  const requestId = String(body.requestId ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const doc = await addDocument({
    companyId: user.companyId,
    caseId: params.id,
    name,
    link,
    status
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

  return NextResponse.json({ document: doc, readyPackagePath, automation, drive }, { status: 201 });
}
