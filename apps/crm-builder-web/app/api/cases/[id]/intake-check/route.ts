import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { runIntakeCheck } from "@/lib/intake-checker";
import { canStaffAccessCase } from "@/lib/rbac";
import { getCase, listDocuments } from "@/lib/store";
import { runAiIntakeCheckAndCreateTasks } from "@/lib/ai-intake-automation";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (!canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const createTasks = body?.createTasks !== false;
  const maxTasks = Math.max(0, Math.min(20, Number(body?.maxTasks || 10)));

  let createdTasks = 0;
  let check = runIntakeCheck(caseItem, await listDocuments(user.companyId, caseItem.id));
  if (createTasks) {
    const auto = await runAiIntakeCheckAndCreateTasks({
      companyId: user.companyId,
      caseId: caseItem.id,
      actorUserId: user.id,
      actorName: user.name,
      maxTasks,
      auditAction: "case.ai.intake_check"
    });
    if (auto) {
      check = auto.check;
      createdTasks = auto.createdTasks;
    }
  } else {
    // still log check-only run for traceability
    await runAiIntakeCheckAndCreateTasks({
      companyId: user.companyId,
      caseId: caseItem.id,
      actorUserId: user.id,
      actorName: user.name,
      maxTasks: 0,
      auditAction: "case.ai.intake_check.preview"
    });
  }

  return NextResponse.json({
    check,
    createdTasks
  });
}
