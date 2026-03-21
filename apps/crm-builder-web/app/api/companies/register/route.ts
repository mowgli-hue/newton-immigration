import { NextResponse } from "next/server";
import { applySessionCookie } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/security";
import { createCompanyWithAdmin, createSession } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const companyName = String(body.companyName ?? "").trim();
  const adminName = String(body.adminName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!companyName || !adminName || !email || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  const strength = validatePasswordStrength(password);
  if (!strength.ok) {
    return NextResponse.json({ error: strength.reason || "Weak password." }, { status: 400 });
  }

  try {
    const { company, user } = await createCompanyWithAdmin({
      companyName,
      adminName,
      email,
      password
    });
    const session = await createSession(user);

    const response = NextResponse.json({
      company,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType
      }
    });

    applySessionCookie(response, session.token);

    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
