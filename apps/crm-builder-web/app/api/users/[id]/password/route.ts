import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { resetUserPassword } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password ?? "");
  if (!password) {
    return NextResponse.json({ error: "password is required" }, { status: 400 });
  }

  const updated = await resetUserPassword(user.companyId, params.id, password);
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
