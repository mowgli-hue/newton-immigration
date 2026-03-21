import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase } from "@/lib/rbac";
import { getCase, resolveCaseDriveRootLink, updateCaseLinks } from "@/lib/store";
import { buildCaseFolderNameWithApp, createCaseDriveStructure, extractDriveFolderId } from "@/lib/google-drive";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (!canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const driveRootChoice = await resolveCaseDriveRootLink(user.companyId, caseItem.id);
  const driveRoot = driveRootChoice.link || "";
  if (!driveRoot) {
    return NextResponse.json({ error: "No Drive root is configured for this case assignment." }, { status: 400 });
  }

  const rootId = extractDriveFolderId(driveRoot);
  if (!rootId) {
    return NextResponse.json({ error: "Could not parse Drive folder id from main link." }, { status: 400 });
  }

  try {
    const structure = await createCaseDriveStructure(
      rootId,
      buildCaseFolderNameWithApp(caseItem.id, caseItem.client, caseItem.formType)
    );
    const updated = await updateCaseLinks(user.companyId, caseItem.id, {
      docsUploadLink: structure.subfolders.clientDocuments.webViewLink,
      applicationFormsLink: structure.subfolders.applicationForms.webViewLink,
      submittedFolderLink: structure.subfolders.submitted.webViewLink,
      correspondenceFolderLink: structure.subfolders.correspondence.webViewLink
    });
    return NextResponse.json({
      case: updated ?? caseItem,
      folder: structure.caseFolder,
      subfolders: structure.subfolders,
      driveRootSource: driveRootChoice.source
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
