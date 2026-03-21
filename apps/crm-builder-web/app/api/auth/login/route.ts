import { NextResponse } from "next/server";
import { applySessionCookie } from "@/lib/auth";
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

  applySessionCookie(response, session.token);

  return response;
}
