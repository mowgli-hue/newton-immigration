import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { findCompanyById } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const company = await findCompanyById(user.companyId);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      userType: user.userType
    },
    company
  });
}
