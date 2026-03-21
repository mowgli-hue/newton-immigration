import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { syncNewtonTeamUsers } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff" || user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await syncNewtonTeamUsers(user.companyId);
  return NextResponse.json({ ok: true, ...result });
}

