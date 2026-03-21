import { NextResponse } from "next/server";
import { applySessionCookie } from "@/lib/auth";
import { addAuditLog, createSessionWithContext, findCompanyById, findUserByCredentials } from "@/lib/store";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ipAddress = forwarded.split(",")[0]?.trim() || "";
  const userAgent = request.headers.get("user-agent") || "";
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  const user = await findUserByCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const session = await createSessionWithContext(user, { ipAddress, userAgent });
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
