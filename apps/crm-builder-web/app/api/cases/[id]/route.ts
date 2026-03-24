import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { stageOrder } from "@/lib/data";
import { canStaffAccessCase } from "@/lib/rbac";
import { buildCaseFolderNameWithApp, createCaseDriveStructure, extractDriveFolderId } from "@/lib/google-drive";
import { addAuditLog, getCase, resolveCaseDriveRootLink, updateCaseLinks, updateCaseProcessing, updateCaseStage } from "@/lib/store";
import { boundedText } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.userType !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const currentCase = await getCase(user.companyId, params.id);
  if (!currentCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (!canStaffAccessCase(user.role, user.name, currentCase.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const stage = String(body.stage ?? "");
  const assignedTo = body?.assignedTo !== undefined ? String(body.assignedTo) : undefined;
  const processingStatusRaw = body?.processingStatus !== undefined ? String(body.processingStatus) : undefined;
  const processingStatus = (
    processingStatusRaw &&
    ["docs_pending", "under_review", "submitted", "other"].includes(processingStatusRaw)
      ? processingStatusRaw
      : undefined
  ) as "docs_pending" | "under_review" | "submitted" | "other" | undefined;
  const processingStatusOther =
    body?.processingStatusOther !== undefined ? boundedText(body.processingStatusOther, 200) : undefined;
  const paymentMethodRaw = body?.paymentMethod !== undefined ? String(body.paymentMethod).trim().toLowerCase() : undefined;
  const paymentMethod = (
    paymentMethodRaw &&
    ["interac", "cash", "card", "bank_transfer", "other"].includes(paymentMethodRaw)
      ? paymentMethodRaw
      : undefined
  ) as "interac" | "cash" | "card" | "bank_transfer" | "other" | undefined;
  const applicationNumber =
    body?.applicationNumber !== undefined ? boundedText(body.applicationNumber, 120) : undefined;
  const submittedAt =
    body?.submittedAt !== undefined ? String(body.submittedAt) : undefined;
  const finalOutcomeRaw = body?.finalOutcome !== undefined ? String(body.finalOutcome).trim().toLowerCase() : undefined;
  const finalOutcome = (
    finalOutcomeRaw &&
    ["approved", "refused", "request_letter", "withdrawn"].includes(finalOutcomeRaw)
      ? finalOutcomeRaw
      : undefined
  ) as "approved" | "refused" | "request_letter" | "withdrawn" | undefined;
  const decisionDate =
    body?.decisionDate !== undefined ? String(body.decisionDate) : undefined;
  const remarks = body?.remarks !== undefined ? boundedText(body.remarks, 1000) : undefined;

  if (
    assignedTo !== undefined ||
    processingStatus !== undefined ||
    processingStatusOther !== undefined ||
    paymentMethod !== undefined ||
    applicationNumber !== undefined ||
    submittedAt !== undefined ||
    finalOutcome !== undefined ||
    decisionDate !== undefined ||
    remarks !== undefined
  ) {
    const updated = await updateCaseProcessing(user.companyId, params.id, {
      assignedTo,
      processingStatus,
      processingStatusOther,
      paymentMethod,
      applicationNumber,
      submittedAt,
      finalOutcome,
      decisionDate,
      remarks
    });
    if (!updated) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    await addAuditLog({
      companyId: user.companyId,
      actorUserId: user.id,
      actorName: user.name,
      action: "case.update.processing",
      resourceType: "case",
      resourceId: updated.id,
      metadata: {
        assignedTo: String(updated.assignedTo || ""),
        processingStatus: String(updated.processingStatus || "")
      }
    });
    let driveReroute: { updated: boolean; reason?: string; error?: string } = { updated: false };
    if (assignedTo !== undefined) {
      try {
        const root = await resolveCaseDriveRootLink(user.companyId, updated.id);
        const rootId = extractDriveFolderId(root.link || "");
        if (rootId) {
          const structure = await createCaseDriveStructure(
            rootId,
            buildCaseFolderNameWithApp(updated.id, updated.client, updated.formType)
          );
          const withDrive = await updateCaseLinks(user.companyId, updated.id, {
            docsUploadLink: structure.subfolders.clientDocuments.webViewLink,
            applicationFormsLink: structure.subfolders.applicationForms.webViewLink,
            submittedFolderLink: structure.subfolders.submitted.webViewLink,
            correspondenceFolderLink: structure.subfolders.correspondence.webViewLink
          });
          driveReroute = { updated: true, reason: root.source };
          return NextResponse.json({ case: withDrive ?? updated, driveReroute });
        }
        driveReroute = { updated: false, reason: "drive_root_missing" };
      } catch (error) {
        driveReroute = { updated: false, error: (error as Error).message };
      }
    }
    return NextResponse.json({ case: updated, driveReroute });
  }

  if (!stageOrder.includes(stage as (typeof stageOrder)[number])) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const updated = await updateCaseStage(user.companyId, params.id, stage as (typeof stageOrder)[number]);
  if (!updated) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  await addAuditLog({
    companyId: user.companyId,
    actorUserId: user.id,
    actorName: user.name,
    action: "case.update.stage",
    resourceType: "case",
    resourceId: updated.id,
    metadata: { stage: updated.stage }
  });

  return NextResponse.json({ case: updated });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await getCase(user.companyId, params.id);
  if (!found) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  if (user.userType === "client" && user.caseId !== found.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.userType === "staff" && !canStaffAccessCase(user.role, user.name, found.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ case: found });
}
