import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { addLegacyResult, listLegacyResults } from "@/lib/store";
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
  let outcome = "other";
  let notes = "";
  let fileName = "";
  let fileLink = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    clientName = String(formData.get("clientName") || "").trim();
    phone = String(formData.get("phone") || "").trim();
    applicationNumber = String(formData.get("applicationNumber") || "").trim();
    outcome = String(formData.get("outcome") || "other").trim().toLowerCase();
    notes = String(formData.get("notes") || "").trim();
    const maybeFile = formData.get("file");

    if (maybeFile instanceof File && maybeFile.size > 0) {
      const buffer = Buffer.from(await maybeFile.arrayBuffer());
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
          contentType: maybeFile.type || "application/octet-stream"
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
    outcome = String(body.outcome || "other").trim().toLowerCase();
    notes = String(body.notes || "").trim();
    fileName = String(body.fileName || "").trim();
    fileLink = String(body.fileLink || "").trim();
  }

  if (!applicationNumber) {
    return NextResponse.json({ error: "applicationNumber is required" }, { status: 400 });
  }
  if (!clientName) {
    return NextResponse.json({ error: "clientName is required" }, { status: 400 });
  }
  if (!["approved", "refused", "request_letter", "other"].includes(outcome)) {
    return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
  }

  const item = await addLegacyResult({
    companyId: user.companyId,
    clientName,
    phone,
    applicationNumber,
    outcome: outcome as "approved" | "refused" | "request_letter" | "other",
    notes,
    fileName: fileName || undefined,
    fileLink: fileLink || undefined,
    createdByUserId: user.id,
    createdByName: user.name
  });
  return NextResponse.json({ item }, { status: 201 });
}

