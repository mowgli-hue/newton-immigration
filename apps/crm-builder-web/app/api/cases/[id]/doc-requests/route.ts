import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import {
  addCaseDocRequest,
  addMessage,
  addTask,
  fulfillCaseDocRequest,
  getCase,
  listCaseDocRequests
} from "@/lib/store";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (user.userType === "client" && user.caseId !== caseItem.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await listCaseDocRequests(user.companyId, params.id);
  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const details = String(body.details || "").trim();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const updated = await addCaseDocRequest({
    companyId: user.companyId,
    caseId: params.id,
    title,
    details,
    requestedBy: user.name
  });
  if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  await addTask({
    companyId: user.companyId,
    caseId: params.id,
    title: `Client upload required: ${title}`,
    description: details || "Additional document requested by processing team.",
    assignedTo: updated.client || "Client",
    createdBy: "admin",
    priority: "medium"
  });
  await addMessage({
    companyId: user.companyId,
    caseId: params.id,
    senderType: "staff",
    senderName: user.name,
    text: `Please upload additional document: ${title}${details ? ` | Details: ${details}` : ""}`
  });

  return NextResponse.json({ case: updated, requests: updated.docRequests ?? [] }, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (user.userType === "client" && user.caseId !== caseItem.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const requestId = String(body.requestId || "").trim();
  if (!requestId) return NextResponse.json({ error: "requestId is required" }, { status: 400 });

  const updated = await fulfillCaseDocRequest({
    companyId: user.companyId,
    caseId: params.id,
    requestId,
    fulfilledBy: user.name,
    documentId: body.documentId ? String(body.documentId) : undefined
  });
  if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  await addMessage({
    companyId: user.companyId,
    caseId: params.id,
    senderType: user.userType === "client" ? "client" : "staff",
    senderName: user.name,
    text: `Requested document uploaded/fulfilled for request ${requestId}.`
  });

  return NextResponse.json({ case: updated, requests: updated.docRequests ?? [] });
}

