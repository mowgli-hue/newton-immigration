import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { runIntakeCheck } from "@/lib/intake-checker";
import { canStaffAccessCase } from "@/lib/rbac";
import { addAuditLog, addTask, getCase, listDocuments, listTasks } from "@/lib/store";

function norm(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

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

  const documents = await listDocuments(user.companyId, caseItem.id);
  const check = runIntakeCheck(caseItem, documents);

  let createdTasks = 0;
  if (createTasks && check.recommendedTaskTitles.length > 0) {
    const existing = await listTasks(user.companyId, caseItem.id);
    const pendingTitleSet = new Set(
      existing.filter((t) => t.status === "pending").map((t) => norm(t.title))
    );
    const assignee = String(caseItem.assignedTo || user.name || "Unassigned");

    for (const title of check.recommendedTaskTitles.slice(0, maxTasks)) {
      const normalized = norm(title);
      if (pendingTitleSet.has(normalized)) continue;
      await addTask({
        companyId: user.companyId,
        caseId: caseItem.id,
        title,
        description: "Auto-created by AI Intake Checker based on missing intake or required docs.",
        assignedTo: assignee,
        createdBy: "ai",
        priority: "high"
      });
      pendingTitleSet.add(normalized);
      createdTasks += 1;
    }
  }

  await addAuditLog({
    companyId: user.companyId,
    actorUserId: user.id,
    actorName: user.name,
    action: "case.ai.intake_check",
    resourceType: "case",
    resourceId: caseItem.id,
    metadata: {
      missingIntake: String(check.missingIntakeItems.length),
      missingDocs: String(check.missingRequiredDocs.length),
      createdTasks: String(createdTasks),
      questionnaireComplete: String(check.questionnaireComplete)
    }
  });

  return NextResponse.json({
    check,
    createdTasks
  });
}

