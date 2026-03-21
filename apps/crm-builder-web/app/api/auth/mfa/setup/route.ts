import { NextResponse } from "next/server";
import { addAuditLog, getUserById } from "@/lib/store";
import { buildOtpAuthUri, createPreAuthToken, generateMfaSecret, verifyPreAuthToken } from "@/lib/mfa";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const preAuthToken = String(body.preAuthToken || "").trim();
  if (!preAuthToken) {
    return NextResponse.json({ error: "preAuthToken is required." }, { status: 400 });
  }

  const payload = verifyPreAuthToken(preAuthToken);
  if (!payload || payload.purpose !== "mfa_setup") {
    return NextResponse.json({ error: "Invalid or expired pre-auth token." }, { status: 401 });
  }

  const user = await getUserById(payload.companyId, payload.userId);
  if (!user || user.userType !== "staff") {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const secret = generateMfaSecret();
  const setupToken = createPreAuthToken({
    userId: user.id,
    companyId: user.companyId,
    purpose: "mfa_enable",
    ttlSeconds: 10 * 60,
    secret
  });
  const issuer = String(process.env.MFA_ISSUER || "Newton Immigration");
  const otpauthUrl = buildOtpAuthUri({
    secret,
    accountName: user.email,
    issuer
  });

  await addAuditLog({
    companyId: user.companyId,
    actorUserId: user.id,
    actorName: user.name,
    action: "auth.mfa.setup_initiated",
    resourceType: "user",
    resourceId: user.id,
    metadata: { email: user.email }
  });

  return NextResponse.json({
    mfaSetupRequired: true,
    setupToken,
    manualKey: secret,
    otpauthUrl
  });
}
