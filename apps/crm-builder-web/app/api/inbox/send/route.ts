import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { addMessage } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone, message, caseId } = await request.json().catch(() => ({}));
  if (!phone || !message) return NextResponse.json({ error: "phone and message required" }, { status: 400 });

  const cleanPhone = String(phone).replace(/\D/g, "");
  if (!cleanPhone) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });

  try {
    await sendWhatsAppText(cleanPhone, message);

    // Save to case chat if matched
    if (caseId) {
      await addMessage({
        companyId: user.companyId,
        caseId,
        senderType: "staff",
        senderName: user.name,
        text: `[WhatsApp] ${message}`,
        channel: "whatsapp",
      });
    }

    // Save outbound to inbox table
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await pool.query(
        `INSERT INTO whatsapp_inbox (id, phone, message, direction, matched_case_id, is_read, created_at)
         VALUES ($1, $2, $3, 'outbound', $4, TRUE, NOW())`,
        [`WA-OUT-${Date.now()}`, cleanPhone, message, caseId || null]
      );
      await pool.end();
    } catch { /* non-fatal */ }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
