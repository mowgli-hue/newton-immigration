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
  if (user.userType !== "staff" || (user.role !== "Admin" && user.role !== "ProcessingLead")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const isAdmin = user.role === "Admin";

  const body = await request.json().catch(() => ({}));
  const allowDataDelete = String(process.env.ALLOW_DATA_DELETE || "").toLowerCase() === "true";

  if (Boolean(body?.pruneCases)) {
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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

  const current = await findCompanyById(user.companyId);
  if (!current) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const incomingSections = Array.isArray(body.customPortalSections)
    ? body.customPortalSections
        .map((item: any, index: number) => ({
          id: String(item?.id || "").trim(),
          title: String(item?.title || "").trim(),
          body: String(item?.body || "").trim(),
          fieldType: ["text", "dropdown", "date", "file_upload", "checkbox"].includes(String(item?.fieldType || ""))
            ? String(item.fieldType)
            : "text",
          options: Array.isArray(item?.options)
            ? item.options.map((v: unknown) => String(v || "").trim()).filter(Boolean).slice(0, 30)
            : [],
          visibleFor: Array.isArray(item?.visibleFor)
            ? item.visibleFor.map((v: unknown) => String(v || "").trim().toLowerCase()).filter(Boolean).slice(0, 30)
            : [],
          sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : index + 1,
          enabled: item?.enabled !== false
        }))
        .filter((item: any) => item.id && item.title && item.body)
    : undefined;

  let nextHistory = Array.isArray(current.branding.customPortalSectionHistory)
    ? current.branding.customPortalSectionHistory
    : [];

  if (body.rollbackPortalVersionId && incomingSections === undefined) {
    const rollbackId = String(body.rollbackPortalVersionId || "").trim();
    const target = nextHistory.find((v) => v.id === rollbackId);
    if (!target) {
      return NextResponse.json({ error: "Rollback version not found." }, { status: 404 });
    }
    const nowSections = Array.isArray(current.branding.customPortalSections)
      ? current.branding.customPortalSections
      : [];
    nextHistory = [
      {
        id: `portal_ver_${Date.now()}`,
        createdAt: new Date().toISOString(),
        actorUserId: user.id,
        actorName: user.name,
        sections: nowSections
      },
      ...nextHistory
    ].slice(0, 25);
    const updated = await updateCompanyBranding(user.companyId, {
      customPortalSections: target.sections,
      customPortalSectionHistory: nextHistory
    });
    if (!updated) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    return NextResponse.json({ company: updated });
  }

  if (incomingSections !== undefined) {
    const nowSections = Array.isArray(current.branding.customPortalSections)
      ? current.branding.customPortalSections
      : [];
    nextHistory = [
      {
        id: `portal_ver_${Date.now()}`,
        createdAt: new Date().toISOString(),
        actorUserId: user.id,
        actorName: user.name,
        sections: nowSections
      },
      ...nextHistory
    ].slice(0, 25);
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
    text: body.text,
    customPortalSections: incomingSections,
    customPortalSectionHistory: incomingSections !== undefined ? nextHistory : undefined
  });

  if (!updated) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  return NextResponse.json({ company: updated });
}
