import { NextResponse } from "next/server";
import { addAuditLog, emergencyResetUserAccessByEmail, getUserByEmail } from "@/lib/store";
import { consumeAuthRateLimit } from "@/lib/auth-rate-limit";
import { validatePasswordStrength } from "@/lib/security";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

function getIpAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const recoveryToken = String(process.env.AUTH_RECOVERY_TOKEN || "").trim();
  if (!recoveryToken) {
    return NextResponse.json(
      { error: "Recovery is not configured." },
      { status: 503 }
    );
  }

  const ipAddress = getIpAddress(request);
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  try {
    const limitCheck = await consumeAuthRateLimit({
      key: `auth:recover:${ipAddress}`,
      maxAttempts: Number(process.env.AUTH_RECOVERY_MAX_ATTEMPTS || 5),
      windowSeconds: Number(process.env.AUTH_RECOVERY_WINDOW_SECONDS || 600)
    });
    if (!limitCheck.allowed) {
      const response = NextResponse.json(
        { error: "Too many recovery attempts. Please retry shortly." },
        { status: 429 }
      );
      if (limitCheck.retryAfterSeconds) {
        response.headers.set("Retry-After", String(limitCheck.retryAfterSeconds));
      }
      return response;
    }
  } catch {
    // Keep recovery available even if rate-limit persistence is unavailable.
  }

  if (!token || token !== recoveryToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }
  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: passwordCheck.reason || "Weak password." }, { status: 400 });
  }

  const current = await getUserByEmail(email);
  if (!current) {
    return NextResponse.json({ ok: true });
  }

  const updated = await emergencyResetUserAccessByEmail({
    email,
    password,
    clearMfa: true,
    activate: true
  });
  if (!updated) {
    return NextResponse.json({ ok: true });
  }

  try {
    await addAuditLog({
      companyId: updated.companyId,
      actorUserId: "system",
      actorName: "Recovery",
      action: "auth.recovery_reset",
      resourceType: "user",
      resourceId: updated.id,
      metadata: {
        email: updated.email,
        ipAddress
      }
    });
  } catch {
    // Do not fail password recovery if audit persistence is temporarily unavailable.
  }

  return NextResponse.json({ ok: true });
}
