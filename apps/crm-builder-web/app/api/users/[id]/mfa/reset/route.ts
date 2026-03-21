import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { addAuditLog, getUserById, updateUserMfa } from "@/lib/store";

export async function POST(
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
  if (target.userType !== "staff") {
    return NextResponse.json({ error: "Invalid target user" }, { status: 400 });
  }

  const updated = await updateUserMfa(user.companyId, target.id, {
    mfaEnabled: false,
    mfaSecret: undefined,
    mfaLastVerifiedAt: undefined
  });
  if (!updated) return NextResponse.json({ error: "Could not reset MFA." }, { status: 500 });

  await addAuditLog({
    companyId: user.companyId,
    actorUserId: user.id,
    actorName: user.name,
    action: "admin.mfa.reset",
    resourceType: "user",
    resourceId: updated.id,
    metadata: {
      targetEmail: updated.email
    }
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      active: updated.active !== false,
      mfaEnabled: Boolean(updated.mfaEnabled),
      workspaceDriveLink: updated.workspaceDriveLink || "",
      workspaceDriveFolderId: updated.workspaceDriveFolderId || ""
    }
  });
}
