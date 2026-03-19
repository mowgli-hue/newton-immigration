import { accessSync, constants } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { startImm5710Automation } from "@/lib/imm5710-runner";
import { getCase, updateCaseImm5710Automation } from "@/lib/store";
import { getDataDir } from "@/lib/storage-paths";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const readyPackagePath = join(getDataDir(), "ready_packages", `${caseItem.id}_pgwp.json`);
  try {
    accessSync(readyPackagePath, constants.R_OK);
  } catch {
    return NextResponse.json(
      { error: "Ready package JSON not found. Generate Ready Package JSON first." },
      { status: 400 }
    );
  }

  const run = startImm5710Automation(readyPackagePath);
  if (!run.started) {
    await updateCaseImm5710Automation(user.companyId, caseItem.id, {
      status: "failed",
      readyPackagePath,
      lastError: run.error || run.skippedReason || "Could not start automation."
    });
    return NextResponse.json({ error: run.error || run.skippedReason || "Could not start automation." }, { status: 400 });
  }

  await updateCaseImm5710Automation(user.companyId, caseItem.id, {
    status: "started",
    startedAt: new Date().toISOString(),
    pid: run.pid,
    logPath: run.logPath,
    readyPackagePath,
    autoTriggered: false,
    lastError: undefined
  });

  return NextResponse.json({
    ok: true,
    started: true,
    pid: run.pid,
    readyPackagePath,
    logPath: run.logPath
  });
}
