import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase } from "@/lib/rbac";
import { addOutboundMessage, getCase, listOutboundMessages } from "@/lib/store";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (user.userType === "client" && user.caseId !== caseItem.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.userType === "staff" && !canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await listOutboundMessages(user.companyId, params.id);
  return NextResponse.json({ logs });
}

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
  const status = String(body.status || "").trim().toLowerCase();
  const target = String(body.target || "").trim();
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });
  if (!["email", "whatsapp", "sms", "link", "copy"].includes(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }
  if (!["queued", "opened_app", "sent", "failed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const created = await addOutboundMessage({
    companyId: user.companyId,
    caseId: params.id,
    channel: channel as "email" | "whatsapp" | "sms" | "link" | "copy",
    status: status as "queued" | "opened_app" | "sent" | "failed",
    target: target || undefined,
    message,
    createdByUserId: user.id,
    createdByName: user.name
  });
  return NextResponse.json({ log: created }, { status: 201 });
}
