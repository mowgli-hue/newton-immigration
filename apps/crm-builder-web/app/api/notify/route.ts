import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { targetName, message, caseId } = body;

    const { readStore, writeStore } = await import("@/lib/store");
    const store = await readStore();

    // Find user by name
    const targetUser = store.users?.find((u: any) => 
      String(u.name || "").toLowerCase() === String(targetName || "").toLowerCase() &&
      u.companyId === user.companyId
    );

    const notice = {
      id: `NTF-${Date.now()}`,
      companyId: user.companyId,
      userId: targetUser?.id || targetName, // fallback to name if user not found
      type: "ai_alert" as const,
      message,
      caseId: caseId || null,
      read: false,
      createdAt: new Date().toISOString()
    };

    if (!store.notifications) store.notifications = [];
    store.notifications.unshift(notice);
    await writeStore(store);

    return NextResponse.json({ ok: true, notified: targetUser?.name || targetName });
  } catch (e) {
    console.error("Notify error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
