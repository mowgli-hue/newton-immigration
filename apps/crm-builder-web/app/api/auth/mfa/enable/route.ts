import { NextResponse } from "next/server";
import { applySessionCookie } from "@/lib/auth";
import { addAuditLog, createSessionWithContext, findCompanyById, getUserById, updateUserMfa } from "@/lib/store";
import { verifyPreAuthToken, verifyTotp } from "@/lib/mfa";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ipAddress = forwarded.split(",")[0]?.trim() || "";
  const userAgent = request.headers.get("user-agent") || "";

  const body = await request.json().catch(() => ({}));
  const setupToken = String(body.setupToken || "").trim();
  const code = String(body.code || "").trim();
  if (!setupToken || !code) {
    return NextResponse.json({ error: "setupToken and code are required." }, { status: 400 });
  }

  const payload = verifyPreAuthToken(setupToken);
  if (!payload || payload.purpose !== "mfa_enable" || !payload.secret) {
    return NextResponse.json({ error: "Invalid or expired setup token." }, { status: 401 });
  }

  const user = await getUserById(payload.companyId, payload.userId);
  if (!user || user.userType !== "staff") {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const ok = verifyTotp(payload.secret, code, { window: 1 });
  if (!ok) {
    await addAuditLog({
      companyId: user.companyId,
      actorUserId: user.id,
      actorName: user.name,
      action: "auth.mfa.enable_failed",
      resourceType: "user",
      resourceId: user.id,
      metadata: { email: user.email, ipAddress: ipAddress || "unknown" }
    });
    return NextResponse.json({ error: "Invalid MFA code." }, { status: 401 });
  }

  const updated = await updateUserMfa(user.companyId, user.id, {
    mfaEnabled: true,
    mfaSecret: payload.secret,
    mfaLastVerifiedAt: new Date().toISOString()
  });
  if (!updated) {
    return NextResponse.json({ error: "Could not enable MFA." }, { status: 500 });
  }

  const session = await createSessionWithContext(updated, { ipAddress, userAgent });
  const company = await findCompanyById(updated.companyId);
  const response = NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      userType: updated.userType
    },
    company
  });
  applySessionCookie(response, session.token);

  await addAuditLog({
    companyId: updated.companyId,
    actorUserId: updated.id,
    actorName: updated.name,
    action: "auth.mfa.enabled",
    resourceType: "user",
    resourceId: updated.id,
    metadata: { email: updated.email }
  });

  return response;
}
