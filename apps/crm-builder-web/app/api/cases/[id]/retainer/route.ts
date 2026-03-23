import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase, canUseCommunications } from "@/lib/rbac";
import { getCase, signCaseRetainer, syncCaseAutomation, updateCaseRetainerSetup } from "@/lib/store";

const SIGN_TYPES = new Set(["initials", "signature", "typed"]);

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (user.userType === "client" && user.caseId !== caseItem.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.userType === "staff") {
    if (!canUseCommunications(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  const body = await request.json().catch(() => ({}));
  const signerName = String(body.signerName ?? "").trim();
  const signatureType = String(body.signatureType ?? "typed").trim();
  const signatureValue = String(body.signatureValue ?? "").trim();
  const acceptedTerms = Boolean(body.acceptedTerms);

  if (!signerName || !signatureValue || !SIGN_TYPES.has(signatureType)) {
    return NextResponse.json(
      { error: "signerName, signatureType(initials|signature|typed), and signatureValue are required" },
      { status: 400 }
    );
  }
  if (!acceptedTerms) {
    return NextResponse.json({ error: "You must accept terms before signing" }, { status: 400 });
  }

  const updated = await signCaseRetainer({
    companyId: user.companyId,
    caseId: params.id,
    signerName,
    signatureType: signatureType as "initials" | "signature" | "typed",
    signatureValue,
    acceptedTerms
  });

  if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  await syncCaseAutomation(user.companyId, params.id);
  const latest = await getCase(user.companyId, params.id);
  return NextResponse.json({ case: latest ?? updated });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!canUseCommunications(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (!canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const formType = body?.formType !== undefined ? String(body.formType) : undefined;
  const retainerAmount = body?.retainerAmount !== undefined ? Number(body.retainerAmount) : undefined;
  const paymentMethod = body?.paymentMethod === "interac" ? "interac" : undefined;
  const interacRecipient =
    body?.interacRecipient !== undefined ? String(body.interacRecipient) : undefined;
  const interacInstructions =
    body?.interacInstructions !== undefined ? String(body.interacInstructions) : undefined;
  const sendRetainer = Boolean(body?.sendRetainer);
  const paymentStatusRaw = body?.paymentStatus !== undefined ? String(body.paymentStatus) : undefined;
  const paymentStatus =
    paymentStatusRaw === "paid" || paymentStatusRaw === "pending" || paymentStatusRaw === "not_required"
      ? paymentStatusRaw
      : undefined;

  const updated = await updateCaseRetainerSetup(user.companyId, params.id, {
    formType,
    retainerAmount,
    paymentMethod,
    interacRecipient,
    interacInstructions,
    sendRetainer,
    paymentStatus
  });
  if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  await syncCaseAutomation(user.companyId, params.id);
  const latest = await getCase(user.companyId, params.id);
  return NextResponse.json({ case: latest ?? updated });
}
