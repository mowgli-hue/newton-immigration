import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/security";
import { getUserById, resetUserPassword } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff" || user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await getUserById(user.companyId, params.id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.userType !== "staff") return NextResponse.json({ error: "Invalid target user" }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const password = String(body.password ?? "");
  if (!password) {
    return NextResponse.json({ error: "password is required" }, { status: 400 });
  }
  const strength = validatePasswordStrength(password);
  if (!strength.ok) {
    return NextResponse.json({ error: strength.reason || "Weak password." }, { status: 400 });
  }

  const updated = await resetUserPassword(user.companyId, params.id, password);
  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
