import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase, canUseCommunications } from "@/lib/rbac";
import { getCase, updateCaseLinks } from "@/lib/store";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!canUseCommunications(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (!canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const questionnaireLink = body?.questionnaireLink;
  const docsUploadLink = body?.docsUploadLink;

  if (questionnaireLink === undefined && docsUploadLink === undefined) {
    return NextResponse.json(
      { error: "Provide questionnaireLink and/or docsUploadLink" },
      { status: 400 }
    );
  }

  const updated = await updateCaseLinks(user.companyId, params.id, {
    questionnaireLink: questionnaireLink !== undefined ? String(questionnaireLink) : undefined,
    docsUploadLink: docsUploadLink !== undefined ? String(docsUploadLink) : undefined
  });

  if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json({ case: updated });
}
