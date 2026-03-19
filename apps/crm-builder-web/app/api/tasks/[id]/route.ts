import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { updateTaskStatus } from "@/lib/store";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const statusRaw = String(body.status ?? "").trim().toLowerCase();
  const status = statusRaw === "completed" ? "completed" : "pending";

  const updated = await updateTaskStatus(user.companyId, params.id, status);
  if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json({ task: updated });
}
