import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getCurrentUserFromRequest } from "@/lib/auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_inbox (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      direction TEXT NOT NULL DEFAULT 'inbound',
      matched_case_id TEXT,
      matched_case_name TEXT,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();
  const res = await pool.query(
    `SELECT * FROM whatsapp_inbox ORDER BY created_at DESC LIMIT 200`
  );
  return NextResponse.json({ messages: res.rows });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await ensureTable();
  await pool.query(`UPDATE whatsapp_inbox SET is_read = TRUE WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
