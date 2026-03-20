import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import {
  findCompanyById,
  pruneCompanyDataToCaseIds,
  resetCompanyDataToSingleCase,
  updateCompanyBranding
} from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await findCompanyById(user.companyId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  return NextResponse.json({ company });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "Admin" || user.userType !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const allowDataDelete = String(process.env.ALLOW_DATA_DELETE || "").toLowerCase() === "true";

  if (Boolean(body?.pruneCases)) {
    if (!allowDataDelete) {
      return NextResponse.json(
        { error: "Data deletion is disabled in production." },
        { status: 403 }
      );
    }
    const confirmText = String(body?.confirmText ?? "").trim().toUpperCase();
    if (confirmText !== "PRUNE") {
      return NextResponse.json(
        { error: 'Set "confirmText" to "PRUNE" to confirm deleting other case records.' },
        { status: 400 }
      );
    }

    const keepCaseIds = Array.isArray(body?.keepCaseIds) ? body.keepCaseIds.map(String) : [];
    try {
      const result = await pruneCompanyDataToCaseIds({
        companyId: user.companyId,
        keepCaseIds,
        keepStaffSessions: true
      });
      return NextResponse.json({
        ok: true,
        message: "Pruned company data to selected cases",
        deletedCount: result.deletedCount,
        keptCaseIds: result.keptCases.map((c) => c.id)
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not prune cases.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (Boolean(body?.resetCompanyData)) {
    if (!allowDataDelete) {
      return NextResponse.json(
        { error: "Data deletion is disabled in production." },
        { status: 403 }
      );
    }
    const confirmText = String(body?.confirmText ?? "").trim().toUpperCase();
    if (confirmText !== "RESET") {
      return NextResponse.json(
        { error: 'Set "confirmText" to "RESET" to confirm deleting test records.' },
        { status: 400 }
      );
    }

    try {
      const freshCase = await resetCompanyDataToSingleCase({
        companyId: user.companyId,
        clientName: String(body?.clientName ?? "Nirmaljeet Kaur"),
        caseNumber: Number(body?.caseNumber ?? 1006),
        formType: String(body?.formType ?? "PGWP"),
        keepStaffSessions: true
      });

      return NextResponse.json({
        ok: true,
        message: "Company data reset complete",
        case: freshCase
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not reset company data.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  const updated = await updateCompanyBranding(user.companyId, {
    appName: body.appName,
    logoText: body.logoText,
    logoUrl: body.logoUrl,
    driveRootLink: body.driveRootLink,
    primary: body.primary,
    secondary: body.secondary,
    success: body.success,
    background: body.background,
    text: body.text
  });

  if (!updated) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  return NextResponse.json({ company: updated });
}
