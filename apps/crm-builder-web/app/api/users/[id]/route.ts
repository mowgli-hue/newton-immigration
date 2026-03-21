import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getUserById, setUserActive } from "@/lib/store";

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
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "active boolean is required" }, { status: 400 });
  }
  if (target.id === user.id && body.active === false) {
    return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
  }

  const updated = await setUserActive(user.companyId, params.id, body.active);
  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      active: updated.active !== false,
      workspaceDriveLink: updated.workspaceDriveLink || "",
      workspaceDriveFolderId: updated.workspaceDriveFolderId || ""
    }
  });
}
