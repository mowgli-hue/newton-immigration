import { access, constants } from "node:fs/promises";
import { dirname } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { extractDriveFolderId } from "@/lib/google-drive";
import { getDataDir, getStorePath } from "@/lib/storage-paths";
import { findCompanyById, listCases, readStore } from "@/lib/store";

type CheckStatus = "pass" | "warn" | "fail";

type BotCheck = {
  id: string;
  title: string;
  status: CheckStatus;
  detail: string;
};

function finalizeChecks(checks: BotCheck[]) {
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const passCount = checks.filter((c) => c.status === "pass").length;
  const overall: CheckStatus = failCount > 0 ? "fail" : warnCount > 0 ? "warn" : "pass";
  return { checks, summary: { overall, failCount, warnCount, passCount, total: checks.length } };
}

const KNOWN_WEAK_PASSWORDS = new Set([
  "admin123",
  "owner123",
  "reviewer123",
  "client123",
  "password",
  "123456",
  "12345678"
]);

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff" || user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const checks: BotCheck[] = [];

  checks.push({
    id: "auth",
    title: "Admin Session",
    status: "pass",
    detail: `Authenticated as ${user.email}`
  });

  const dataDir = getDataDir();
  const storePath = getStorePath();
  const storeDir = dirname(storePath);

  try {
    await access(dataDir, constants.R_OK | constants.W_OK);
    checks.push({
      id: "storage_dir",
      title: "Storage Directory Access",
      status: "pass",
      detail: `Readable/writable: ${dataDir}`
    });
  } catch {
    checks.push({
      id: "storage_dir",
      title: "Storage Directory Access",
      status: "warn",
      detail: `Cannot access data directory: ${dataDir}`
    });
  }

  try {
    await access(storeDir, constants.R_OK | constants.W_OK);
    checks.push({
      id: "store_dir",
      title: "Store Directory Access",
      status: "pass",
      detail: `Readable/writable: ${storeDir}`
    });
  } catch {
    checks.push({
      id: "store_dir",
      title: "Store Directory Access",
      status: "fail",
      detail: `Cannot access store directory: ${storeDir}`
    });
  }

  const store = await readStore().catch(() => null);
  if (!store) {
    checks.push({
      id: "store_file",
      title: "Store File Read",
      status: "fail",
      detail: `Could not read store file at ${storePath}`
    });
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      ...finalizeChecks(checks)
    });
  }
  checks.push({
    id: "store_file",
    title: "Store File Read",
    status: "pass",
    detail: `Store file loaded from ${storePath}`
  });

  const allowDataDelete = String(process.env.ALLOW_DATA_DELETE || "").toLowerCase() === "true";
  checks.push({
    id: "delete_lock",
    title: "Delete Protection (Server)",
    status: allowDataDelete ? "warn" : "pass",
    detail: allowDataDelete
      ? "ALLOW_DATA_DELETE=true (dangerous in production)"
      : "ALLOW_DATA_DELETE is disabled"
  });

  const allowDataDeleteUi = String(process.env.NEXT_PUBLIC_ALLOW_DATA_DELETE || "").toLowerCase() === "true";
  checks.push({
    id: "delete_ui",
    title: "Delete Protection (UI)",
    status: allowDataDeleteUi ? "warn" : "pass",
    detail: allowDataDeleteUi
      ? "NEXT_PUBLIC_ALLOW_DATA_DELETE=true (cleanup UI visible)"
      : "Cleanup UI hidden"
  });

  const company = await findCompanyById(user.companyId);
  if (!company) {
    checks.push({
      id: "company",
      title: "Company Record",
      status: "fail",
      detail: `Company not found for ${user.companyId}`
    });
  } else {
    checks.push({
      id: "company",
      title: "Company Record",
      status: "pass",
      detail: `${company.name} (${company.slug})`
    });

    const driveRoot = String(company.branding?.driveRootLink || "").trim();
    if (!driveRoot) {
      checks.push({
        id: "drive_root",
        title: "Drive Root Link",
        status: "warn",
        detail: "Drive root link is empty in company branding"
      });
    } else {
      const folderId = extractDriveFolderId(driveRoot);
      checks.push({
        id: "drive_root",
        title: "Drive Root Link",
        status: folderId ? "pass" : "fail",
        detail: folderId ? "Drive folder id detected" : "Could not parse Drive folder id from root link"
      });
    }
  }

  const serviceEmail = String(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim();
  const serviceKey = String(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").trim();
  if (!serviceEmail || !serviceKey) {
    checks.push({
      id: "drive_env",
      title: "Google Drive Credentials",
      status: "warn",
      detail: "GOOGLE_SERVICE_ACCOUNT_EMAIL and/or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is missing"
    });
  } else {
    checks.push({
      id: "drive_env",
      title: "Google Drive Credentials",
      status: "pass",
      detail: "Service account credentials are present"
    });
  }

  const inviteNeverExpires = String(process.env.INVITE_LINK_NEVER_EXPIRES || "true").toLowerCase() !== "false";
  const inviteExpiryEnabled = String(process.env.INVITE_LINK_ENABLE_EXPIRY || "").toLowerCase() === "true";
  checks.push({
    id: "invite_policy",
    title: "Invite Expiry Policy",
    status: inviteNeverExpires || !inviteExpiryEnabled ? "warn" : "pass",
    detail:
      inviteNeverExpires || !inviteExpiryEnabled
        ? "Invite links are effectively long-lived. Consider enabling expiry for better security."
        : "Invite expiry is enabled"
  });

  const companyCases = await listCases(user.companyId);
  const duplicateCaseIds = new Set<string>();
  const seenIds = new Set<string>();
  for (const c of companyCases) {
    if (seenIds.has(c.id)) duplicateCaseIds.add(c.id);
    seenIds.add(c.id);
  }
  const missingCoreFields = companyCases.filter((c) => !String(c.client || "").trim() || !String(c.formType || "").trim()).length;
  checks.push({
    id: "case_integrity",
    title: "Case Integrity",
    status: duplicateCaseIds.size > 0 || missingCoreFields > 0 ? "fail" : "pass",
    detail:
      duplicateCaseIds.size > 0 || missingCoreFields > 0
        ? `Duplicates: ${duplicateCaseIds.size}, missing client/form type rows: ${missingCoreFields}`
        : `${companyCases.length} cases checked`
  });

  const invalidFinancialRows = companyCases.filter((c) => {
    const total = Number(c.servicePackage?.retainerAmount || 0);
    const paid = Number(c.amountPaid || 0);
    return total < 0 || paid < 0 || paid > total + 0.01;
  }).length;
  checks.push({
    id: "financial_integrity",
    title: "Financial Integrity",
    status: invalidFinancialRows > 0 ? "warn" : "pass",
    detail:
      invalidFinancialRows > 0
        ? `${invalidFinancialRows} case(s) have invalid paid/total amounts`
        : "No invalid payment totals found"
  });

  const weakPasswordCount = store.users.filter(
    (u) => u.companyId === user.companyId && KNOWN_WEAK_PASSWORDS.has(String(u.password || "").trim())
  ).length;
  checks.push({
    id: "password_strength",
    title: "Password Strength",
    status: weakPasswordCount > 0 ? "warn" : "pass",
    detail:
      weakPasswordCount > 0
        ? `${weakPasswordCount} account(s) still use weak default passwords`
        : "No known weak default passwords found"
  });

  const danglingClientUsers = store.users.filter(
    (u) =>
      u.companyId === user.companyId &&
      u.userType === "client" &&
      u.caseId &&
      !companyCases.some((c) => c.id === u.caseId)
  ).length;
  checks.push({
    id: "client_links",
    title: "Client Account Links",
    status: danglingClientUsers > 0 ? "warn" : "pass",
    detail:
      danglingClientUsers > 0
        ? `${danglingClientUsers} client account(s) point to missing case IDs`
        : "All client accounts are linked to existing cases"
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    ...finalizeChecks(checks)
  });
}
