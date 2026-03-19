import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { findCompanyById, getCase, updateCaseLinks } from "@/lib/store";
import { buildCaseFolderName, createCaseDriveStructure, extractDriveFolderId } from "@/lib/google-drive";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const company = await findCompanyById(user.companyId);
  const driveRoot = company?.branding?.driveRootLink || "";
  if (!driveRoot) {
    return NextResponse.json({ error: "Main Google Drive folder link is not set in Company Branding." }, { status: 400 });
  }

  const rootId = extractDriveFolderId(driveRoot);
  if (!rootId) {
    return NextResponse.json({ error: "Could not parse Drive folder id from main link." }, { status: 400 });
  }

  try {
    const structure = await createCaseDriveStructure(rootId, buildCaseFolderName(caseItem.id, caseItem.client));
    const updated = await updateCaseLinks(user.companyId, caseItem.id, {
      docsUploadLink: structure.subfolders.clientDocuments.webViewLink,
      applicationFormsLink: structure.subfolders.applicationForms.webViewLink,
      submittedFolderLink: structure.subfolders.submitted.webViewLink,
      correspondenceFolderLink: structure.subfolders.correspondence.webViewLink
    });
    return NextResponse.json({ case: updated ?? caseItem, folder: structure.caseFolder, subfolders: structure.subfolders });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
