import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { markNotificationRead } from "@/lib/store";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updated = await markNotificationRead(user.companyId, user.id, params.id);
  if (!updated) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

  return NextResponse.json({ notification: updated });
}
