import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase } from "@/lib/rbac";
import { getCase } from "@/lib/store";
import {
  buildS3ObjectKey,
  getSignedUploadUrl,
  isS3StorageEnabled,
  toS3StoredLink
} from "@/lib/object-storage";

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

  if (!isS3StorageEnabled()) {
    return NextResponse.json({ error: "S3 storage backend is not enabled." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const fileName = String(body.fileName || "").trim();
  const fileType = String(body.fileType || "").trim() || "application/octet-stream";
  if (!fileName) return NextResponse.json({ error: "fileName is required." }, { status: 400 });

  const key = buildS3ObjectKey({
    companyId: user.companyId,
    caseId: params.id,
    fileName
  });
  const uploadUrl = await getSignedUploadUrl({
    key,
    contentType: fileType,
    expiresInSeconds: Number(process.env.S3_SIGNED_URL_EXPIRES || 300)
  });

  return NextResponse.json({
    uploadUrl,
    storageLink: toS3StoredLink(key),
    expiresInSeconds: Number(process.env.S3_SIGNED_URL_EXPIRES || 300)
  });
}
