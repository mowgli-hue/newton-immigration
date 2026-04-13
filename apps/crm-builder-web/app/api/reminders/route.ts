import { NextRequest, NextResponse } from "next/server";
import { listCases, getLatestClientInviteForCase } from "@/lib/store";
import { sendPortalReminder, sendStaleEmailReminder } from "@/lib/whatsapp-smart-reply";

const SYSTEM_TOKEN = process.env.AUTH_RECOVERY_TOKEN || "newton-recovery-2024";
const COMPANY_ID = process.env.DEFAULT_COMPANY_ID || "newton";
const BASE_URL = process.env.NEXTAUTH_URL || "https://junglecrm-builder-web-production-d358.up.railway.app";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body.token !== SYSTEM_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cases = await listCases(COMPANY_ID);
  const now = Date.now();
  const results = { portalReminders: 0, staleAlerts: 0 };

  // 1. Portal reminders — clients who opened but didn't complete
  if (body.type === "portal" || body.type === "all") {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    
    for (const c of cases) {
      if (!c.leadPhone) continue;
      if (c.retainerSigned && Object.keys(c.pgwpIntake || {}).length > 5) continue; // already done
      
      // Check if they have an invite that was accepted
      const invite = await getLatestClientInviteForCase(COMPANY_ID, c.id);
      if (!invite || invite.status !== "accepted") continue;
      
      // Check last reminder — don't spam (max once every 3 days)
      const lastReminder = await pool.query(
        `SELECT created_at FROM whatsapp_inbox WHERE phone LIKE $1 AND message LIKE '%portal%reminder%' ORDER BY created_at DESC LIMIT 1`,
        [`%${c.leadPhone.replace(/\D/g,"").slice(-9)}%`]
      ).catch(() => ({ rows: [] }));
      
      if (lastReminder.rows.length > 0) {
        const daysSince = (now - new Date(lastReminder.rows[0].created_at).getTime()) / (1000*60*60*24);
        if (daysSince < 3) continue;
      }
      
      const portalLink = `${BASE_URL}/invite/${invite.token}`;
      await sendPortalReminder({
        phone: c.leadPhone,
        clientName: c.client,
        formType: c.formType,
        portalLink
      });
      results.portalReminders++;
      await new Promise(r => setTimeout(r, 500));
    }
    await pool.end();
  }

  // 2. Stale case email reminders — cases not updated in 7+ days
  if (body.type === "stale" || body.type === "all") {
    const STALE_DAYS = body.staleDays || 7;
    const staleCases = cases
      .filter(c => c.processingStatus !== "submitted")
      .filter(c => {
        const lastUpdate = new Date(c.updatedAt || c.createdAt || "").getTime();
        const daysSince = (now - lastUpdate) / (1000*60*60*24);
        return daysSince >= STALE_DAYS;
      })
      .map(c => ({
        id: c.id,
        client: c.client,
        formType: c.formType,
        assignedTo: c.assignedTo || "Unassigned",
        daysSinceUpdate: Math.floor((now - new Date(c.updatedAt || c.createdAt || "").getTime()) / (1000*60*60*24))
      }))
      .sort((a,b) => b.daysSinceUpdate - a.daysSinceUpdate)
      .slice(0, 20); // max 20 per email

    if (staleCases.length > 0) {
      await sendStaleEmailReminder(staleCases);
      results.staleAlerts = staleCases.length;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
