import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { addAuditLog, destroySession, resolveUserFromSessionWithContext } from "@/lib/store";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ipAddress = forwarded.split(",")[0]?.trim() || request.ip || "";
  const userAgent = request.headers.get("user-agent") || "";
  const user = token ? await resolveUserFromSessionWithContext(token, { ipAddress, userAgent }) : null;

  if (token) {
    await destroySession(token);
  }
  if (user) {
    await addAuditLog({
      companyId: user.companyId,
      actorUserId: user.id,
      actorName: user.name,
      action: "auth.logout",
      resourceType: "case",
      resourceId: user.id,
      metadata: {
        email: user.email,
        userType: user.userType
      }
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
