import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase } from "@/lib/rbac";
import { addTask, listCases, listTasks } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caseId = request.nextUrl.searchParams.get("caseId") || undefined;
  const tasks = (await listTasks(user.companyId, caseId)).filter((t) => t.createdBy === "admin");
  if (user.userType !== "staff") return NextResponse.json({ tasks: [] });
  const allCases = await listCases(user.companyId);
  const allowedCaseIds = new Set(
    allCases
      .filter((c) => canStaffAccessCase(user.role, user.name, c.assignedTo))
      .map((c) => c.id)
  );
  return NextResponse.json({
    tasks: tasks.filter((t) => t.caseId === "GENERAL" || allowedCaseIds.has(t.caseId))
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const caseId = String(body.caseId ?? "").trim() || "GENERAL";
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const assignedTo = String(body.assignedTo ?? user.name).trim();
  const priorityRaw = String(body.priority ?? "medium").trim().toLowerCase();
  const priority = priorityRaw === "low" || priorityRaw === "high" ? priorityRaw : "medium";
  const dueDate = String(body.dueDate ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
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
