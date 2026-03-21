import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase } from "@/lib/rbac";
import { dispatchCommunication } from "@/lib/communications";
import { addOutboundMessage, getCase } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (!canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const channel = String(body.channel || "").trim().toLowerCase();
  const target = String(body.target || "").trim();
  const message = String(body.message || "").trim();
  if (!["email", "sms", "whatsapp"].includes(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }
  if (!target || !message) {
    return NextResponse.json({ error: "target and message are required" }, { status: 400 });
  }

  const result = await dispatchCommunication({
    channel: channel as "email" | "sms" | "whatsapp",
    target,
    message
  });

  const log = await addOutboundMessage({
    companyId: user.companyId,
    caseId: caseItem.id,
    channel: channel as "email" | "sms" | "whatsapp",
    status: result.ok ? "sent" : result.status === "provider_missing" ? "queued" : "failed",
    target,
    message,
    createdByUserId: user.id,
    createdByName: user.name
  });

  return NextResponse.json({ result, log });
}

