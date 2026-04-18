import { NextRequest, NextResponse } from "next/server";
import { listCases, listUsers, addNotification } from "@/lib/store";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { Pool } from "pg";

const SYSTEM_TOKEN = process.env.AUTH_RECOVERY_TOKEN || "newton-recovery-2024";
const COMPANY_ID = process.env.DEFAULT_COMPANY_ID || "newton";

// Staff WhatsApp numbers to notify
const STAFF_PHONES = (process.env.STAFF_WHATSAPP_PHONES || "").split(",").filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.token !== SYSTEM_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver", weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const todayShort = new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
    const cases = await listCases(COMPANY_ID);
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

    // ── 1. IRCC NEWS & IMMIGRATION UPDATES ──────────────────────────────────
    let irccNews = "";
    try {
      const newsRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{
            role: "user",
            content: `Search for the latest IRCC Canada immigration news from the past 24-48 hours. Focus on:
1. New policy announcements or changes
2. Processing time updates
3. New programs or pathways
4. Important deadlines
5. Any alerts affecting: PGWP, SOWP, Study Permits, Work Permits, TRV, PR applications

Today is ${todayShort}. Provide a concise summary in bullet points. Max 5 most important updates.`
          }]
        })
      });
      if (newsRes.ok) {
        const newsData = await newsRes.json() as any;
        const text = newsData.content?.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n") || "";
        irccNews = text.slice(0, 800);
      }
    } catch(e) { irccNews = "Could not fetch latest IRCC news. Check www.canada.ca/ircc for updates."; }

    // ── 2. EXPIRING PERMITS ──────────────────────────────────────────────────
    const expiringCases: any[] = [];
    const urgentCases: any[] = [];
    const missingDocsCases: any[] = [];
    const staleCases: any[] = [];
    const now = Date.now();

    for (const c of cases) {
      const intake = (c.pgwpIntake || {}) as Record<string, string>;
      const permitExpiry = intake.studyPermitExpiryDate || intake.workPermitExpiryDate || (c as any).permitExpiryDate || "";
      if (permitExpiry) {
        const expiryDate = new Date(permitExpiry);
        const daysLeft = Math.floor((expiryDate.getTime() - now) / 86400000);
        if (daysLeft >= 0 && daysLeft <= 30) {
          expiringCases.push({ ...c, daysLeft, permitExpiry });
        }
      }
      if (c.isUrgent) urgentCases.push(c);
      if ((c as any).docsPending > 0) missingDocsCases.push(c);
      
      // Stale cases - no update in 7+ days
      const lastUpdate = new Date((c as any).updatedAt || c.createdAt || "").getTime();
      const daysSinceUpdate = Math.floor((now - lastUpdate) / 86400000);
      if (daysSinceUpdate >= 7 && c.processingStatus !== "submitted") {
        staleCases.push({ ...c, daysSinceUpdate });
      }
    }

    // ── 3. RESULTS CHECK ────────────────────────────────────────────────────
    const recentResults: any[] = [];
    try {
      const resultsRes = await pool.query(
        `SELECT * FROM submitted_apps_lookup WHERE updated_at > NOW() - INTERVAL '24 hours' ORDER BY updated_at DESC LIMIT 10`
      );
      recentResults.push(...resultsRes.rows);
    } catch(e) {}

    // ── 4. PIPELINE STATS ────────────────────────────────────────────────────
    const statsByStatus = cases.reduce((acc: Record<string, number>, c) => {
      const s = c.processingStatus || "docs_pending";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const statsByType = cases.reduce((acc: Record<string, number>, c) => {
      const ft = c.formType?.split("(")[0].trim() || "Other";
      acc[ft] = (acc[ft] || 0) + 1;
      return acc;
    }, {});

    // ── 5. BUILD BRIEFING MESSAGE ────────────────────────────────────────────
    const lines: string[] = [
      `🍁 *Newton Immigration — Daily Briefing*`,
      `📅 ${today}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `📊 *PIPELINE OVERVIEW*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `• Total Active Cases: *${cases.length}*`,
      `• Docs Pending: *${statsByStatus["docs_pending"] || 0}*`,
      `• Under Review: *${statsByStatus["under_review"] || 0}*`,
      `• Urgent: *${urgentCases.length}*`,
      ``,
    ];

    if (expiringCases.length > 0) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`⚠️ *PERMITS EXPIRING SOON*`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
      expiringCases.slice(0, 5).forEach(c => {
        const emoji = c.daysLeft <= 7 ? "🔴" : c.daysLeft <= 14 ? "🟡" : "🟢";
        lines.push(`${emoji} ${c.client} — ${c.formType?.split("(")[0].trim()} — *${c.daysLeft} days* left`);
      });
      lines.push(``);
    }

    if (recentResults.length > 0) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`✅ *NEW IRCC RESULTS (24hrs)*`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
      recentResults.slice(0, 5).forEach(r => {
        const emoji = r.result?.toLowerCase().includes("approv") ? "✅" : r.result?.toLowerCase().includes("refus") ? "❌" : "📋";
        lines.push(`${emoji} ${r.name} — ${r.app_type} — *${r.result || "pending"}*`);
      });
      lines.push(``);
    }

    if (staleCases.length > 0) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`💤 *STALE CASES (7+ days)*`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
      staleCases.slice(0, 5).forEach(c => {
        lines.push(`• ${c.client} (${c.id}) — *${c.daysSinceUpdate} days* no update`);
      });
      lines.push(``);
    }

    if (irccNews) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`📰 *IRCC NEWS & UPDATES*`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(irccNews);
      lines.push(``);
    }

    lines.push(`— Newton AI 🤖`);

    const briefingMsg = lines.join("\n");

    // ── 6. SEND TO STAFF VIA WHATSAPP ───────────────────────────────────────
    const sentTo: string[] = [];
    for (const phone of STAFF_PHONES) {
      try {
        await sendWhatsAppText(phone.trim(), briefingMsg);
        sentTo.push(phone);
      } catch(e) {}
    }

    // ── 7. SEND AS CRM NOTIFICATIONS ────────────────────────────────────────
    const users = await listUsers(COMPANY_ID);
    const admins = users.filter(u => ["Admin", "ProcessingLead"].includes(u.role) && u.active !== false);
    for (const admin of admins) {
      await addNotification({
        companyId: COMPANY_ID,
        userId: admin.id,
        type: "ai_alert",
        message: `📅 Daily Briefing: ${cases.length} active cases | ${expiringCases.length} expiring soon | ${recentResults.length} new results | ${urgentCases.length} urgent`
      });
    }

    // ── 8. INDIVIDUAL PERMIT EXPIRY ALERTS ──────────────────────────────────
    // Send reminders to clients with permits expiring in exactly 30, 14, 7 days
    const reminderResults: string[] = [];
    for (const c of expiringCases) {
      if ([30, 14, 7].includes(c.daysLeft) && c.leadPhone) {
        const phone = String(c.leadPhone).replace(/\D/g, "");
        const firstName = String(c.client || "").split(" ")[0];
        const msg = `Hello ${firstName}! 🍁\n\nThis is a reminder from Newton Immigration.\n\nYour *${c.formType}* permit expires in *${c.daysLeft} days* on ${c.permitExpiry}.\n\nPlease contact us immediately if you haven't already to discuss your options.\n\n📞 +1 778-723-6662\n\n— Newton Immigration Team`;
        try {
          await sendWhatsAppText(phone, msg);
          reminderResults.push(`${c.client}: reminder sent (${c.daysLeft} days)`);
        } catch(e) {}
      }
    }

    await pool.end();

    return NextResponse.json({
      ok: true,
      briefingSent: sentTo.length,
      expiringCases: expiringCases.length,
      recentResults: recentResults.length,
      staleCases: staleCases.length,
      clientReminders: reminderResults,
      urgentCases: urgentCases.length
    });

  } catch(e) {
    console.error("Newton briefing error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
