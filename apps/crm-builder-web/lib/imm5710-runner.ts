import { accessSync, constants, openSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { CaseItem } from "@/lib/models";

export type Imm5710RunResult = {
  started: boolean;
  pid?: number;
  logPath?: string;
  error?: string;
  skippedReason?: string;
};

function findImmAutomationDir(): string {
  const cwd = process.cwd();
  const candidates = [
    resolve(cwd, "..", "..", "imm5710_automation"),
    resolve(cwd, "..", "imm5710_automation"),
    resolve(cwd, "imm5710_automation")
  ];

  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.R_OK);
      accessSync(join(candidate, "main.py"), constants.R_OK);
      return candidate;
    } catch {
      // keep searching
    }
  }

  throw new Error("imm5710_automation folder not found from CRM app runtime.");
}

export function startImm5710Automation(readyPackagePath: string): Imm5710RunResult {
  try {
    accessSync(readyPackagePath, constants.R_OK);
  } catch {
    return { started: false, error: "Ready package JSON not found." };
  }

  const x = String(process.env.IMM_AUTOMATION_FIRST_FIELD_X || "").trim();
  const y = String(process.env.IMM_AUTOMATION_FIRST_FIELD_Y || "").trim();
  if (!x || !y) {
    return {
      started: false,
      error: "Set IMM_AUTOMATION_FIRST_FIELD_X and IMM_AUTOMATION_FIRST_FIELD_Y in .env.local."
    };
  }

  let immDir = "";
  try {
    immDir = findImmAutomationDir();
  } catch (error) {
    return { started: false, error: (error as Error).message };
  }

  const pythonBin = process.env.IMM_AUTOMATION_PYTHON_BIN || "python3";
  const mainPy = join(immDir, "main.py");
  const logPath = join(immDir, "automation.log");

  try {
    const stdoutFd = openSync(logPath, "a");
    const stderrFd = openSync(logPath, "a");

    const child = spawn(pythonBin, [mainPy], {
      cwd: immDir,
      env: {
        ...process.env,
        IMM_AUTOMATION_DATA_SOURCE_TYPE: "ready_package",
        IMM_READY_PACKAGE_JSON_PATH: readyPackagePath,
        IMM_AUTOMATION_DEBUG_MODE: "true",
        IMM_AUTOMATION_DEBUG_MAX_CLIENTS: "1",
        IMM_AUTOMATION_SKIP_CALIBRATION: "true",
        IMM_AUTOMATION_HOTKEYS_ENABLED: "false",
        IMM_AUTOMATION_FIRST_FIELD_X: x,
        IMM_AUTOMATION_FIRST_FIELD_Y: y
      },
      detached: true,
      stdio: ["ignore", stdoutFd, stderrFd]
    });

    child.unref();
    return {
      started: true,
      pid: child.pid,
      logPath
    };
  } catch (error) {
    return { started: false, error: (error as Error).message };
  }
}

export function maybeAutoRunImm5710(caseItem: CaseItem, readyPackagePath: string): Imm5710RunResult {
  const enabled = String(process.env.IMM_AUTOMATION_AUTO_RUN_ON_READY || "true").toLowerCase() !== "false";
  if (!enabled) return { started: false, skippedReason: "Auto-run disabled by IMM_AUTOMATION_AUTO_RUN_ON_READY=false." };

  const automation = caseItem.imm5710Automation;
  if (automation?.status === "started" && automation.startedAt) {
    const elapsedMs = Date.now() - new Date(automation.startedAt).getTime();
    if (elapsedMs < 30 * 60 * 1000) {
      return { started: false, skippedReason: "Automation already started recently." };
    }
  }

  return startImm5710Automation(readyPackagePath);
}
