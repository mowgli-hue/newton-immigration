import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { addCaseMilestone, addInvoice, recordCasePayment, toggleMilestone, updateCaseFinancials } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const updated = await updateCaseFinancials(user.companyId, params.id, {
    name: body.name,
    retainerAmount: body.retainerAmount,
    balanceAmount: body.balanceAmount
  });
  if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json({ case: updated });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const actionRaw = String(body.action ?? "").trim();
  const action = actionRaw.toLowerCase().replace(/[\s_-]+/g, "");
  const amountInput = String(body.amount ?? "").trim();
  const amountMaybe = Number(amountInput.replace(/[^0-9.]/g, "") || 0);

  if (action === "addmilestone") {
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    const updated = await addCaseMilestone(user.companyId, params.id, title);
    if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    return NextResponse.json({ case: updated });
  }

  if (action === "addinvoice") {
    const title = String(body.title ?? "").trim();
    const amount = Number(body.amount ?? 0);
    if (!title || amount <= 0) return NextResponse.json({ error: "title and positive amount required" }, { status: 400 });
    const updated = await addInvoice(user.companyId, params.id, title, amount);
    if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    return NextResponse.json({ case: updated });
  }

  if (action === "togglemilestone") {
    const milestoneId = String(body.milestoneId ?? "").trim();
    if (!milestoneId) return NextResponse.json({ error: "milestoneId required" }, { status: 400 });
    const updated = await toggleMilestone(user.companyId, params.id, milestoneId);
    if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    return NextResponse.json({ case: updated });
  }

  if (
    action === "recordpayment" ||
    action === "payment" ||
    action === "confirmpayment" ||
    action === "record" ||
    (!action && Number.isFinite(amountMaybe) && amountMaybe > 0)
  ) {
    const amount = amountMaybe;
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
    }
    const updated = await recordCasePayment(user.companyId, params.id, amount);
    if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    return NextResponse.json({ case: updated });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
