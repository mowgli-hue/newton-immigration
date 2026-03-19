import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { maybeAutoRunImm5710 } from "@/lib/imm5710-runner";
import {
  addTask,
  getCase,
  listDocuments,
  listTasks,
  syncCaseAutomation,
  updateCaseImm5710Automation
} from "@/lib/store";
import { buildReadyPackage, writeReadyPackageToDisk } from "@/lib/ready-package";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const formType = caseItem.formType.toLowerCase();
  if (!formType.includes("pgwp") && !formType.includes("imm5710")) {
    return NextResponse.json(
      { error: "Ready package currently supports PGWP/IMM5710 cases." },
      { status: 400 }
    );
  }

  await syncCaseAutomation(user.companyId, caseItem.id);
  const refreshed = await getCase(user.companyId, params.id);
  if (!refreshed) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  const documents = await listDocuments(user.companyId, refreshed.id);
  const { readyPackage, missingCoreQuestions } = buildReadyPackage(refreshed, documents);

  if (missingCoreQuestions.length > 0) {
    const existingTasks = await listTasks(user.companyId, refreshed.id);
    const assignedTo = refreshed.owner && refreshed.owner !== "N/A" ? refreshed.owner : user.name;

    for (const q of missingCoreQuestions) {
      const title = `IMM5710 data needed: ${q.label}`;
      const alreadyOpen = existingTasks.some(
        (t) => t.status === "pending" && t.title.toLowerCase() === title.toLowerCase()
      );
      if (alreadyOpen) continue;

      await addTask({
        companyId: user.companyId,
        caseId: refreshed.id,
        title,
        description:
          "Collect this missing IMM5710 answer from client or case team, then update PGWP intake.",
        assignedTo,
        priority: "high",
        createdBy: "ai"
      });
    }
  }

  const outFile = await writeReadyPackageToDisk(refreshed.id, readyPackage);
  let automation: { started: boolean; skippedReason?: string; error?: string } | null = null;
  if (readyPackage.readiness.readyForHumanReview) {
    const run = maybeAutoRunImm5710(refreshed, outFile);
    automation = run;
    if (run.started) {
      await updateCaseImm5710Automation(user.companyId, refreshed.id, {
        status: "started",
        startedAt: new Date().toISOString(),
        pid: run.pid,
        logPath: run.logPath,
        readyPackagePath: outFile,
        autoTriggered: true,
        lastError: undefined
      });
    } else if (run.error) {
      await updateCaseImm5710Automation(user.companyId, refreshed.id, {
        status: "failed",
        readyPackagePath: outFile,
        lastError: run.error,
        autoTriggered: true
      });
    }
  }

  return NextResponse.json({
    ok: true,
    caseId: refreshed.id,
    filePath: outFile,
    readyPackage,
    automation
  });
}
