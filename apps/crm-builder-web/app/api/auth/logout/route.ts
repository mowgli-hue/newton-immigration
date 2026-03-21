import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { addAuditLog, destroySession, resolveUserFromSession } from "@/lib/store";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await resolveUserFromSession(token) : null;

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
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
