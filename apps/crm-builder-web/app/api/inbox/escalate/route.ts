import { NextRequest, NextResponse } from "next/server";
import { checkEscalations } from "@/lib/whatsapp-smart-reply";

// Called by a cron job or Railway cron every 30 mins
export async function GET(request: NextRequest) {
  const token = request.headers.get("x-admin-token") || 
    new URL(request.url).searchParams.get("token");
  if (token !== (process.env.AUTH_RECOVERY_TOKEN || "newton-recovery-2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await checkEscalations();
  return NextResponse.json({ ok: true, checked: new Date().toISOString() });
}
