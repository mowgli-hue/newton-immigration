import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { addTask, listTasks } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caseId = request.nextUrl.searchParams.get("caseId") || undefined;
  const tasks = await listTasks(user.companyId, caseId);
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const caseId = String(body.caseId ?? "").trim();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const assignedTo = String(body.assignedTo ?? user.name).trim();
  const priorityRaw = String(body.priority ?? "medium").trim().toLowerCase();
  const priority = priorityRaw === "low" || priorityRaw === "high" ? priorityRaw : "medium";
  const dueDate = String(body.dueDate ?? "").trim();

  if (!caseId || !title) {
    return NextResponse.json({ error: "caseId and title are required" }, { status: 400 });
  }

  const task = await addTask({
    companyId: user.companyId,
    caseId,
    title,
    description,
    assignedTo,
    priority,
    dueDate: dueDate || undefined,
    createdBy: "admin"
  });
  return NextResponse.json({ task }, { status: 201 });
}
