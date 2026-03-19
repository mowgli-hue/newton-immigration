import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { createSession, findCompanyById, findUserByCredentials } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await findUserByCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const session = await createSession(user);
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
}
