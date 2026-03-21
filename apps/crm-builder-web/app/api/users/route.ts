import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/security";
import { inviteUser, listUsers } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await listUsers(user.companyId);
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active !== false,
      mfaEnabled: Boolean(u.mfaEnabled),
      workspaceDriveLink: u.workspaceDriveLink || "",
      workspaceDriveFolderId: u.workspaceDriveFolderId || ""
    }))
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff" || user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const role = String(body.role ?? "").trim();
  const password = String(body.password ?? "temp1234");
  const workspaceDriveLink = String(body.workspaceDriveLink ?? "").trim();
  const workspaceDriveFolderId = String(body.workspaceDriveFolderId ?? "").trim();

  if (!name || !email || !role) {
    return NextResponse.json({ error: "name, email, role are required" }, { status: 400 });
  }

  if (!["Admin", "Marketing", "Processing", "ProcessingLead", "Reviewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const strength = validatePasswordStrength(password);
  if (!strength.ok) {
    return NextResponse.json({ error: strength.reason || "Weak password." }, { status: 400 });
  }

  try {
    const created = await inviteUser({
      companyId: user.companyId,
      name,
      email,
      role: role as "Admin" | "Marketing" | "Processing" | "ProcessingLead" | "Reviewer",
      password,
      workspaceDriveLink: workspaceDriveLink || undefined,
      workspaceDriveFolderId: workspaceDriveFolderId || undefined
    });

    return NextResponse.json(
      {
        user: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
