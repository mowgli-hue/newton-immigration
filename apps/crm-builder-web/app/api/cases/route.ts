import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canCreateCase } from "@/lib/rbac";
import { createCase, listCases, resolveCaseDriveRootLink, updateCaseLinks } from "@/lib/store";
import { buildCaseFolderNameWithApp, createCaseDriveStructure, extractDriveFolderId } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.userType === "client" && user.caseId) {
    const all = await listCases(user.companyId);
    const onlyOwn = all.filter((c) => c.id === user.caseId);
    return NextResponse.json({
      cases: onlyOwn,
      user: { id: user.id, role: user.role, name: user.name, userType: user.userType }
    });
  }

  const cases = await listCases(user.companyId);
  return NextResponse.json({
    cases,
    user: { id: user.id, role: user.role, name: user.name, userType: user.userType }
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.userType !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canCreateCase(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const client = String(body.client ?? "").trim();
  const formType = String(body.formType ?? "").trim();
  const leadPhone = body?.leadPhone !== undefined ? String(body.leadPhone).trim() : undefined;
  const leadEmail = body?.leadEmail !== undefined ? String(body.leadEmail).trim() : undefined;
  const isUrgent = Boolean(body?.isUrgent);
  const dueInDays =
    body?.dueInDays !== undefined && Number.isFinite(Number(body.dueInDays))
      ? Number(body.dueInDays)
      : undefined;

  if (!client || !formType) {
    return NextResponse.json({ error: "client and formType are required" }, { status: 400 });
  }

  const created = await createCase({
    companyId: user.companyId,
    client,
    formType,
    leadPhone,
    leadEmail,
    isUrgent,
    dueInDays
  });
  const driveRootChoice = await resolveCaseDriveRootLink(user.companyId, created.id);
  const driveRoot = driveRootChoice.link || "";
  let drive: { linked: boolean; reason?: string; error?: string } = {
    linked: false,
    reason: "drive_root_missing"
  };

  if (driveRoot) {
    const rootId = extractDriveFolderId(driveRoot);
    if (rootId) {
      try {
        const structure = await createCaseDriveStructure(
          rootId,
          buildCaseFolderNameWithApp(created.id, created.client, created.formType)
        );
        const withDrive = await updateCaseLinks(user.companyId, created.id, {
          docsUploadLink: structure.subfolders.clientDocuments.webViewLink,
          applicationFormsLink: structure.subfolders.applicationForms.webViewLink,
          submittedFolderLink: structure.subfolders.submitted.webViewLink,
          correspondenceFolderLink: structure.subfolders.correspondence.webViewLink
        });
        drive = { linked: true, reason: driveRootChoice.source };
        return NextResponse.json({ case: withDrive ?? created, drive }, { status: 201 });
      } catch (error) {
        drive = { linked: false, reason: "drive_create_failed", error: (error as Error).message };
      }
    } else {
      drive = { linked: false, reason: "drive_root_invalid" };
    }
  }

  return NextResponse.json({ case: created, drive }, { status: 201 });
}
