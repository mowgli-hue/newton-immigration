import { runIntakeCheck } from "@/lib/intake-checker";
import { addAuditLog, addTask, getCase, listDocuments, listTasks } from "@/lib/store";

function norm(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function runAiIntakeCheckAndCreateTasks(input: {
  companyId: string;
  caseId: string;
  actorUserId: string;
  actorName: string;
  maxTasks?: number;
  auditAction?: string;
}) {
  const caseItem = await getCase(input.companyId, input.caseId);
  if (!caseItem) return null;

  const documents = await listDocuments(input.companyId, caseItem.id);
  const check = runIntakeCheck(caseItem, documents);
  const existing = await listTasks(input.companyId, caseItem.id);
  const pendingTitleSet = new Set(
    existing.filter((t) => t.status === "pending").map((t) => norm(t.title))
  );

  const maxTasks = Math.max(0, Math.min(20, Number(input.maxTasks || 10)));
  const assignee = String(caseItem.assignedTo || input.actorName || "Unassigned");
  let createdTasks = 0;

  for (const title of check.recommendedTaskTitles.slice(0, maxTasks)) {
    const normalized = norm(title);
    if (pendingTitleSet.has(normalized)) continue;
    await addTask({
      companyId: input.companyId,
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

  await addAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    action: input.auditAction || "case.ai.intake_check",
    resourceType: "case",
    resourceId: caseItem.id,
    metadata: {
      missingIntake: String(check.missingIntakeItems.length),
      missingDocs: String(check.missingRequiredDocs.length),
      createdTasks: String(createdTasks),
      questionnaireComplete: String(check.questionnaireComplete)
    }
  });

  return { check, createdTasks };
}

