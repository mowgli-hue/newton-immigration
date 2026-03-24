import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import {
  addDocument,
  addLegacyResult,
  getCase,
  listLegacyResults,
  markLegacyResultInformed,
  resolveCaseDriveRootLink,
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

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(0, 120) || "result.bin";
}

async function ensureCaseDriveFolders(companyId: string, caseId: string) {
  const caseItem = await getCase(companyId, caseId);
  if (!caseItem) return null;
  if (
    caseItem.applicationFormsLink &&
    caseItem.submittedFolderLink &&
    caseItem.correspondenceFolderLink &&
    caseItem.docsUploadLink
  ) {
    return caseItem;
  }
  const choice = await resolveCaseDriveRootLink(companyId, caseId);
  const rootId = extractDriveFolderId(String(choice.link || "").trim());
  if (!rootId) return caseItem;
  const structure = await createCaseDriveStructure(
    rootId,
    buildCaseFolderNameWithApp(caseItem.id, caseItem.client, caseItem.formType)
  );
  await updateCaseLinks(companyId, caseId, {
    docsUploadLink: structure.subfolders.clientDocuments.webViewLink,
    applicationFormsLink: structure.subfolders.applicationForms.webViewLink,
    submittedFolderLink: structure.subfolders.submitted.webViewLink,
    correspondenceFolderLink: structure.subfolders.correspondence.webViewLink
  });
  return (await getCase(companyId, caseId)) || caseItem;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff" && user.role === "Client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await listLegacyResults(user.companyId);
  const resolved = await Promise.all(
    items.map(async (item) => {
      if (!item.fileLink || !isS3StoredLink(item.fileLink)) return item;
      const key = fromS3StoredLink(item.fileLink);
      if (!key) return item;
      try {
        const signed = await getSignedDownloadUrl({ key, expiresInSeconds: 300 });
        return { ...item, fileLink: signed };
      } catch {
        return item;
      }
    })
  );
  return NextResponse.json({ items: resolved });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff" && user.role === "Client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";
  let clientName = "";
  let phone = "";
  let applicationNumber = "";
  let resultDate = "";
  let outcome = "other";
  let notes = "";
  let fileName = "";
  let fileLink = "";
  let uploadedBuffer: Buffer | null = null;
  let uploadedMimeType = "application/octet-stream";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    clientName = String(formData.get("clientName") || "").trim();
    phone = String(formData.get("phone") || "").trim();
    applicationNumber = String(formData.get("applicationNumber") || "").trim();
    resultDate = String(formData.get("resultDate") || "").trim();
    outcome = String(formData.get("outcome") || "other").trim().toLowerCase();
    notes = String(formData.get("notes") || "").trim();
    const maybeFile = formData.get("file");

    if (maybeFile instanceof File && maybeFile.size > 0) {
      const buffer = Buffer.from(await maybeFile.arrayBuffer());
      uploadedBuffer = buffer;
      uploadedMimeType = maybeFile.type || "application/octet-stream";
      const safe = `${Date.now()}_${sanitizeFilename(maybeFile.name || "result.bin")}`;
      fileName = safe;
      if (isS3StorageEnabled()) {
        await putObjectToS3({
          key: buildS3ObjectKey({
            companyId: user.companyId,
            caseId: "legacy-results",
            fileName: safe
          }),
          content: buffer,
          contentType: uploadedMimeType
        });
        fileLink = toS3StoredLink(
          buildS3ObjectKey({
            companyId: user.companyId,
            caseId: "legacy-results",
            fileName: safe
          })
        );
      } else {
        const dir = join(process.cwd(), "public", "uploads", "legacy-results");
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, safe), buffer);
        fileLink = `/uploads/legacy-results/${safe}`;
      }
    }
  } else {
    const body = await request.json().catch(() => ({}));
    clientName = String(body.clientName || "").trim();
    phone = String(body.phone || "").trim();
    applicationNumber = String(body.applicationNumber || "").trim();
    resultDate = String(body.resultDate || "").trim();
    outcome = String(body.outcome || "other").trim().toLowerCase();
    notes = String(body.notes || "").trim();
    fileName = String(body.fileName || "").trim();
    fileLink = String(body.fileLink || "").trim();
  }

  if (!applicationNumber) {
    return NextResponse.json({ error: "applicationNumber is required" }, { status: 400 });
  }
  if (!clientName) clientName = "Legacy Client";
  if (!["approved", "refused", "request_letter", "other"].includes(outcome)) {
    return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
  }

  const item = await addLegacyResult({
    companyId: user.companyId,
    clientName,
    phone,
    applicationNumber,
    resultDate: resultDate || undefined,
    outcome: outcome as "approved" | "refused" | "request_letter" | "other",
    notes,
    fileName: fileName || undefined,
    fileLink: fileLink || undefined,
    createdByUserId: user.id,
    createdByName: user.name
  });
  if (item.autoCategory === "new" && item.matchedCaseId && item.fileLink) {
    await addDocument({
      companyId: user.companyId,
      caseId: item.matchedCaseId,
      name: item.fileName || `Result ${item.applicationNumber}`,
      category: "result",
      status: "received",
      link: item.fileLink
    });
    if (uploadedBuffer) {
      try {
        const caseWithFolders = await ensureCaseDriveFolders(user.companyId, item.matchedCaseId);
        const submittedFolderId = extractDriveFolderId(
          String(caseWithFolders?.submittedFolderLink || "")
        );
        if (submittedFolderId) {
          const resultsFolder = await getOrCreateDriveSubfolder(submittedFolderId, "Results");
          await uploadFileToDriveFolder({
            folderId: resultsFolder.id,
            fileName: item.fileName || `Result_${item.applicationNumber}.pdf`,
            fileBuffer: uploadedBuffer,
            mimeType: uploadedMimeType
          });
        }
      } catch {
        // Keep primary stored file available even if Drive mirror fails.
      }
    }
  }
  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff" && user.role === "Client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const resultId = String(body.resultId || "").trim();
  if (!resultId) {
    return NextResponse.json({ error: "resultId is required" }, { status: 400 });
  }
  const item = await markLegacyResultInformed({
    companyId: user.companyId,
    resultId,
    informedByName: user.name
  });
  if (!item) return NextResponse.json({ error: "Result not found" }, { status: 404 });
  return NextResponse.json({ item });
}
