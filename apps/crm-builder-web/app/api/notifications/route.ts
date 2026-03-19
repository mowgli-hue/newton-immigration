import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { listNotifications } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notices = await listNotifications(user.companyId, user.id);
  return NextResponse.json({ notifications: notices });
}
