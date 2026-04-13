import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_notes (
      id TEXT PRIMARY KEY,
      staff_user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      author_id TEXT NOT NULL DEFAULT '',
      author_name TEXT NOT NULL DEFAULT '',
      text TEXT NOT NULL,
      pinned BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();
  const res = await pool.query(
    `SELECT * FROM staff_notes WHERE staff_user_id = $1 AND company_id = $2 ORDER BY created_at DESC`,
    [params.id, user.companyId]
  );
  return NextResponse.json({ notes: res.rows });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { text, authorName, pinned } = await request.json().catch(() => ({}));
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  await ensureTable();
  const id = `SNOTE-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  await pool.query(
    `INSERT INTO staff_notes (id, staff_user_id, company_id, author_id, author_name, text, pinned) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, params.id, user.companyId, user.id || "", authorName || user.name, text, pinned || false]
  );
  const res = await pool.query(
    `SELECT * FROM staff_notes WHERE staff_user_id = $1 AND company_id = $2 ORDER BY created_at DESC`,
    [params.id, user.companyId]
  );
  return NextResponse.json({ ok: true, id, notes: res.rows });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const noteId = url.searchParams.get("noteId");
  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });
  await pool.query(
    `DELETE FROM staff_notes WHERE id = $1 AND company_id = $2`,
    [noteId, user.companyId]
  );
  const res = await pool.query(
    `SELECT * FROM staff_notes WHERE staff_user_id = $1 AND company_id = $2 ORDER BY created_at DESC`,
    [params.id, user.companyId]
  );
  return NextResponse.json({ ok: true, notes: res.rows });
}
