import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { createCase, listCases } from "@/lib/store";

type LeadRow = {
  name: string;
  phone: string;
  email: string;
  formType: string;
  sourceLeadKey: string;
};

function normalizeHeaderName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((value) => value.trim() !== ""));
}

function firstMatch(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) => normalizeHeaderName(h));
  for (const candidate of candidates) {
    const idx = normalized.indexOf(normalizeHeaderName(candidate));
    if (idx !== -1) return idx;
  }
  return -1;
}

function clean(value: string): string {
  return String(value ?? "").trim();
}

function normalizeApplicationType(value: string): string {
  const raw = clean(value);
  if (!raw) return "IMM5710";
  const lower = raw.toLowerCase();
  if (lower.includes("pgwp")) return "PGWP";
  if (lower.includes("work permit")) return "Work Permit";
  if (lower.includes("study permit")) return "Study Permit";
  if (lower.includes("visitor") || lower.includes("trv")) return "TRV";
  return raw;
}

function buildLeadRows(csvText: string): LeadRow[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const body = rows.slice(1);

  const nameIdx = firstMatch(headers, ["First name, Last Name", "Client Name", "Full Name", "Name"]);
  const phoneIdx = firstMatch(headers, ["Phone Number", "Phone", "Contact Number", "Mobile"]);
  const emailIdx = firstMatch(headers, ["Email Address", "Email"]);
  const appTypeIdx = firstMatch(headers, ["1. Application Type Selection", "Application Type", "Type"]);
  const timestampIdx = firstMatch(headers, ["Timestamp", "Created At", "Date"]);

  const result: LeadRow[] = [];
  for (const row of body) {
    const name = nameIdx >= 0 ? clean(row[nameIdx] || "") : "";
    const phone = phoneIdx >= 0 ? clean(row[phoneIdx] || "") : "";
    const email = emailIdx >= 0 ? clean(row[emailIdx] || "") : "";
    const formTypeRaw = appTypeIdx >= 0 ? clean(row[appTypeIdx] || "") : "";
    const formType = normalizeApplicationType(formTypeRaw);
    const timestamp = timestampIdx >= 0 ? clean(row[timestampIdx] || "") : "";

    if (!phone) continue;
    if (!name) continue;

    const sourceLeadKey = [timestamp, phone.toLowerCase(), email.toLowerCase(), name.toLowerCase(), formType.toLowerCase()]
      .join("|")
      .trim();

    result.push({
      name,
      phone,
      email,
      formType,
      sourceLeadKey
    });
  }

  return result;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const csvUrl =
    String(body?.csvUrl || process.env.LEADS_SHEET_CSV_URL || process.env.NEXT_PUBLIC_LEADS_SHEET_CSV_URL || "").trim();

  if (!csvUrl) {
    return NextResponse.json(
      { error: "CSV URL required. Set LEADS_SHEET_CSV_URL or pass csvUrl in request body." },
      { status: 400 }
    );
  }

  let csvText = "";
  try {
    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch sheet CSV (${response.status}). Check sharing/export access.` },
        { status: 400 }
      );
    }
    csvText = await response.text();
  } catch {
    return NextResponse.json({ error: "Could not fetch Google Sheet CSV URL." }, { status: 400 });
  }

  const leadRows = buildLeadRows(csvText);
  const existing = await listCases(user.companyId);
  const existingKeys = new Set(existing.map((c) => c.sourceLeadKey).filter(Boolean));

  let createdCount = 0;
  let skippedCount = 0;

  for (const row of leadRows) {
    if (!row.sourceLeadKey || existingKeys.has(row.sourceLeadKey)) {
      skippedCount += 1;
      continue;
    }

    await createCase({
      companyId: user.companyId,
      client: row.name,
      formType: row.formType,
      leadPhone: row.phone,
      leadEmail: row.email,
      sourceLeadKey: row.sourceLeadKey
    });
    existingKeys.add(row.sourceLeadKey);
    createdCount += 1;
  }

  return NextResponse.json({
    ok: true,
    sourceRows: leadRows.length,
    created: createdCount,
    skipped: skippedCount
  });
}
