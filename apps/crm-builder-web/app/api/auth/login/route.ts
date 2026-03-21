import { NextResponse } from "next/server";
import { applySessionCookie } from "@/lib/auth";
import { addAuditLog, createSessionWithContext, findCompanyById, findUserByCredentials } from "@/lib/store";
import { createPreAuthToken, verifyTotp } from "@/lib/mfa";
import { clearAuthRateLimit, consumeAuthRateLimit } from "@/lib/auth-rate-limit";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ipAddress = forwarded.split(",")[0]?.trim() || "";
  const userAgent = request.headers.get("user-agent") || "";
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? "");
  const mfaCode = String(body.mfaCode ?? "").trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  const limiterKey = `auth:login:${email}:${ipAddress || "unknown"}`;
  const limitCheck = await consumeAuthRateLimit({
    key: limiterKey,
    maxAttempts: Number(process.env.AUTH_LOGIN_MAX_ATTEMPTS || 8),
    windowSeconds: Number(process.env.AUTH_LOGIN_WINDOW_SECONDS || 300)
  });
  if (!limitCheck.allowed) {
    const response = NextResponse.json(
      { error: "Too many login attempts. Please retry shortly." },
      { status: 429 }
    );
    if (limitCheck.retryAfterSeconds) {
      response.headers.set("Retry-After", String(limitCheck.retryAfterSeconds));
    }
    return response;
  }

  const user = await findUserByCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const forceStaffMfa =
    String(process.env.FORCE_STAFF_MFA || (process.env.NODE_ENV === "production" ? "true" : "false")).toLowerCase() ===
    "true";
  const isStaff = user.userType === "staff";
  if (isStaff && forceStaffMfa) {
    if (!user.mfaEnabled || !String(user.mfaSecret || "").trim()) {
      const preAuthToken = createPreAuthToken({
        userId: user.id,
        companyId: user.companyId,
        purpose: "mfa_setup",
        ttlSeconds: 15 * 60
      });
      return NextResponse.json(
        {
          error: "MFA setup required.",
          mfaSetupRequired: true,
          preAuthToken
        },
        { status: 403 }
      );
    }

    if (!mfaCode) {
      const preAuthToken = createPreAuthToken({
        userId: user.id,
        companyId: user.companyId,
        purpose: "mfa_login",
        ttlSeconds: 10 * 60
      });
      return NextResponse.json(
        {
          error: "MFA code required.",
          mfaRequired: true,
          preAuthToken
        },
        { status: 401 }
      );
    }

    const ok = verifyTotp(String(user.mfaSecret || ""), mfaCode, { window: 1 });
    if (!ok) {
      await addAuditLog({
        companyId: user.companyId,
        actorUserId: user.id,
        actorName: user.name,
        action: "auth.mfa.failed",
        resourceType: "user",
        resourceId: user.id,
        metadata: {
          email: user.email,
          ipAddress: ipAddress || "unknown"
        }
      });
      return NextResponse.json({ error: "Invalid MFA code." }, { status: 401 });
    }
  }

  const session = await createSessionWithContext(user, { ipAddress, userAgent });
  await clearAuthRateLimit(limiterKey);
  const company = await findCompanyById(user.companyId);
  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      userType: user.userType
    },
    company
  });

  applySessionCookie(response, session.token);
  await addAuditLog({
    companyId: user.companyId,
    actorUserId: user.id,
    actorName: user.name,
    action: "auth.login",
    resourceType: "case",
    resourceId: user.id,
    metadata: {
      email: user.email,
      userType: user.userType,
      ipAddress: ipAddress || "unknown"
    }
  });

  return response;
}
