import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase } from "@/lib/rbac";
import { getCase, listDocuments } from "@/lib/store";
import { generatePgwpDraft } from "@/lib/pgwp";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (!canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!caseItem.formType.toLowerCase().includes("pgwp")) {
    return NextResponse.json({ error: "AI draft currently enabled for PGWP only." }, { status: 400 });
  }

  const documents = await listDocuments(user.companyId, params.id);
  const draft = generatePgwpDraft(caseItem, documents);

  return NextResponse.json({ draft });
}
