import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { acceptClientInvite, createSession } from "@/lib/store";

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const body = await request.json().catch(() => ({}));
  const nameRaw = String(body.name ?? "").trim();
  const emailRaw = String(body.email ?? "").trim();
  const passwordRaw = String(body.password ?? "");

  // One-click client access mode (no login form required).
  // If email/password are not provided, generate unique credentials internally.
  const name = nameRaw || "Client";
  const email =
    emailRaw ||
    `client-${params.token.slice(0, 8)}-${Date.now()}@flowdesk.local`;
  const password =
    passwordRaw ||
    `fd_${params.token.slice(0, 10)}_${Math.random().toString(36).slice(2, 10)}`;

  try {
    const { user, company } = await acceptClientInvite({ token: params.token, name, email, password });
    const session = await createSession(user);

    const response = NextResponse.json({
      ok: true,
      company: { id: company.id, name: company.name, slug: company.slug },
      user: { id: user.id, name: user.name, email: user.email, userType: user.userType }
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
