/**
 * Newton Immigration — One-Time CSV Import Script
 * ─────────────────────────────────────────────────
 * HOW TO RUN:
 *
 *   1. Copy this file + your 3 CSVs into:  apps/crm-builder-web/
 *   2. Rename CSVs to:
 *        Assigned_Applications.csv
 *        Under_Review.csv
 *        Client_Sheet.csv
 *   3. cd apps/crm-builder-web
 *      npx tsx import-cases.ts
 *
 * SAFE TO RE-RUN — skips duplicates by name + application type.
 */

import * as fs from "fs";
import * as path from "path";
import { createCase, readStore, writeStore, listCases } from "./lib/store";

const COMPANY_ID = "newton-immigration";
const CSV_DIR = path.resolve(__dirname);
const ASSIGNED_CSV     = path.join(CSV_DIR, "Assigned_Applications.csv");
const UNDER_REVIEW_CSV = path.join(CSV_DIR, "Under_Review.csv");
const CLIENT_SHEET_CSV = path.join(CSV_DIR, "Client_Sheet.csv");

const STAFF_MAP: Record<string, string> = {
  rajwinder: "Rajwinder Kaur",
  avneet:    "Avneet kaur",
  avneeet:   "Avneet kaur",
  ramandeep: "Ramandeep kaur",
  raman:     "Ramandeep kaur",
  simi:      "Simi das",
  eknoor:    "Avneet kaur",
  sukhman:   "sukhman Kaur",
  rapneet:   "Rapneet kaur",
  komal:     "Avneet kaur",
  serbleen:  "Serbleen Kour",
  lujain:    "Rajwinder Kaur",
  gunmeet:   "Avneet kaur",
  anjali:    "Avneet kaur",
  navdeep:   "Rajwinder Kaur",
  neha:      "neha Brar",
  lavisha:   "Lavisha Dhingra",
  aman:      "Avneet kaur",
  parneet:   "Avneet kaur",
  jasvinder: "Avneet kaur",
  jaspreet:  "Rajwinder Kaur",
  kiran:     "Rajwinder Kaur",
  sandeep:   "Ramandeep kaur",
  huda:      "Avneet kaur",
  gurpreet:  "Rajwinder Kaur",
  komalpreet:"Serbleen Kour",
};

function normalizeStaff(raw: string): string {
  if (!raw || !raw.trim() || raw.trim() === "-") return "Unassigned";
  const first = raw.trim().split(/[\s,/+&]/)[0].toLowerCase().replace(/[^a-z]/g, "");
  return STAFF_MAP[first] || "Unassigned";
}

function normalizeFormType(raw: string): string {
  const t = (raw || "").toLowerCase();
  if (t.includes("pgwp")) return "PGWP";
  if (t.includes("vowp")) return "VOWP";
  if (t.includes("sowp")) return "SOWP";
  if (t.includes("bowp")) return "BOWP";
  if (t.includes("trv") || (t.includes("visitor") && t.includes("visa"))) return "TRV";
  if (t.includes("visitor record") || /\bvr\b/.test(t)) return "Visitor Record";
  if (t.includes("study permit") || t.includes("spe") || t.includes("sp ext") || /\bsp\b/.test(t)) return "Study Permit";
  if (t.includes("lmia")) return "LMIA WP";
  if (t.includes("express entry")) return "Express Entry";
  if (t.includes("pr spousal") || t.includes("spousal pr") || t.includes("pr sponsor")) return "PR Sponsorship";
  if (t.includes("refugee")) return "Refugee";
  if (t.includes("tr to pr") || t.includes("tr-pr")) return "TR to PR";
  if (t.includes("restoration")) return "Restoration";
  if (t.includes("super visa") || t.includes("supervisa")) return "Super Visa";
  if (t.includes("atip")) return "ATIP Notes";
  if (t.includes("alberta") || t.includes("eoi")) return "Alberta EOI";
  if (t.includes("verification") || t.includes("vos")) return "Verification of Status";
  if (t.includes("co-op") || t.includes("co op")) return "Co-op WP";
  if (t.includes("amendment")) return "Amendment";
  if (t.includes("reconsideration")) return "Reconsideration";
  if (t.includes("h&c") || t.includes("humanitarian")) return "H&C";
  if (t.includes("citizenship")) return "Citizenship";
  if (t.includes("pr card")) return "PR Card Renewal";
  if (t.includes("visitor to study")) return "Visitor to Study";
  return (raw || "").trim().substring(0, 50) || "Other";
}

function extractDeadline(text: string): string | undefined {
  const m = text.match(/\b(202\d[-\/]\d{2}[-\/]\d{2})\b/);
  return m ? m[1].replace(/\//g, "-") : undefined;
}

function isUrgent(text: string): boolean {
  return /\burgent\b|\basap\b|today|deadline|expir/i.test(text || "");
}

function parseCSV(filePath: string): string[][] {
  if (!fs.existsSync(filePath)) { console.warn(`⚠️  Not found: ${filePath}`); return []; }
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let cur = "", inQ = false;
  let row: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') { if (inQ && raw[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (c === ',' && !inQ) { row.push(cur.trim()); cur = ""; }
    else if (c === '\n' && !inQ) { row.push(cur.trim()); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur.trim()); rows.push(row); }
  return rows;
}

interface Rec {
  client: string; formType: string; assignedTo: string; phone?: string;
  processingStatus: "docs_pending" | "under_review" | "submitted";
  isUrgent: boolean; deadlineDate?: string; reviewedBy?: string;
  notes?: string; irccFeePayer?: "sir_card" | "client_card";
}

const records: Rec[] = [];

// 1. ASSIGNED APPLICATIONS
console.log("\n📋 Parsing Assigned Applications...");
{
  const rows = parseCSV(ASSIGNED_CSV);
  const header = rows[0] || [];
  const staffCols: Array<{name: string; ci: number; ai: number}> = [];
  for (let i = 0; i < header.length - 1; i++) {
    if (/[-–]\s*client/i.test(header[i])) {
      staffCols.push({ name: header[i].replace(/[-–]\s*client.*/i, "").trim(), ci: i, ai: i+1 });
    }
  }
  let n = 0;
  for (const row of rows.slice(1)) {
    const deadline = extractDeadline(row.join(" "));
    for (const col of staffCols) {
      const client = (row[col.ci] || "").trim();
      const app    = (row[col.ai] || "").trim();
      if (!client || client === "-" || /^\d+$/.test(client) || client.length > 70) continue;
      if (!app || app === "-") continue;
      records.push({
        client, formType: normalizeFormType(app),
        assignedTo: normalizeStaff(col.name),
        isUrgent: isUrgent(app) || isUrgent(client),
        deadlineDate: deadline, processingStatus: "docs_pending",
        notes: app.length > 40 ? app.substring(0, 100) : undefined,
      });
      n++;
    }
  }
  console.log(`   → ${n} cases`);
}

// 2. UNDER REVIEW
console.log("📋 Parsing Under Review...");
{
  const rows = parseCSV(UNDER_REVIEW_CSV);
  let n = 0;
  for (const row of rows.slice(1)) {
    const client = (row[1] || "").trim();
    const app    = (row[2] || "").trim();
    const done   = (row[3] || "").trim();
    const rev    = (row[4] || "").trim();
    const stat   = (row[5] || "").trim().toLowerCase();
    if (!client || !app) continue;
    if (/under review|done by|^\s*$/.test(client.toLowerCase())) continue;
    if (/^\d+$/.test(client) || client.length > 70) continue;
    const submitted = /submit/i.test(stat) || /done/i.test(stat);
    records.push({
      client, formType: normalizeFormType(app),
      assignedTo: normalizeStaff(done),
      reviewedBy: normalizeStaff(rev),
      processingStatus: submitted ? "submitted" : "under_review",
      isUrgent: false,
    });
    n++;
  }
  console.log(`   → ${n} cases`);
}

// 3. CLIENT SHEET
console.log("📋 Parsing Client Sheet...");
{
  const rows = parseCSV(CLIENT_SHEET_CSV);
  let n = 0;
  const monthRe = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i;
  for (const row of rows.slice(1)) {
    const name  = (row[0] || "").trim();
    const phone = (row[1] || "").trim();
    const app   = (row[2] || "").trim();
    const fees  = (row[3] || "").trim();
    const urg   = (row[5] || "").trim();
    const res   = (row[6] || "").trim();
    const pay   = (row[8] || "").trim();
    if (!name || !app || monthRe.test(name) || name.length > 70) continue;
    if (/^name$/i.test(name) || /^\d+th?\s/i.test(name)) continue;
    const feePayer: "sir_card" | "client_card" | undefined =
      /sir.?card/i.test(fees+pay) ? "sir_card" :
      /client.?card/i.test(fees+pay) ? "client_card" : undefined;
    records.push({
      client: name, formType: normalizeFormType(app),
      assignedTo: "Unassigned",
      phone: phone && phone !== "J" && phone.length > 4 ? phone : undefined,
      processingStatus: /done/i.test(res) ? "submitted" : "docs_pending",
      isUrgent: isUrgent(urg) || isUrgent(app),
      irccFeePayer: feePayer,
    });
    n++;
  }
  console.log(`   → ${n} entries`);
}

// RUN IMPORT
async function run() {
  const priority: Record<string, number> = { under_review: 0, submitted: 1, docs_pending: 2 };
  records.sort((a, b) => (priority[a.processingStatus] ?? 3) - (priority[b.processingStatus] ?? 3));

  const existing = await listCases(COMPANY_ID);
  const seen = new Set(existing.map(c => `${c.client.toLowerCase().trim()}|${c.formType.toLowerCase().trim()}`));
  const batchSeen = new Set<string>();
  let created = 0, skipped = 0, errors = 0;

  console.log(`\n🚀 Importing ${records.length} records (${existing.length} already exist)...\n`);

  for (const rec of records) {
    const key = `${rec.client.toLowerCase().trim()}|${rec.formType.toLowerCase().trim()}`;
    if (seen.has(key) || batchSeen.has(key)) { skipped++; continue; }
    batchSeen.add(key);
    try {
      const nc = await createCase({
        companyId: COMPANY_ID, client: rec.client, formType: rec.formType,
        assignedTo: rec.assignedTo, leadPhone: rec.phone,
        isUrgent: rec.isUrgent, deadlineDate: rec.deadlineDate,
        additionalNotes: rec.notes, irccFeePayer: rec.irccFeePayer,
      });
      if (rec.processingStatus !== "docs_pending" || rec.reviewedBy) {
        const store = await readStore();
        const idx = store.cases.findIndex(c => c.id === nc.id);
        if (idx !== -1) {
          store.cases[idx] = {
            ...store.cases[idx],
            processingStatus: rec.processingStatus,
            reviewer: rec.reviewedBy || store.cases[idx].reviewer,
            stage: rec.processingStatus === "submitted" ? "Submitted" :
                   rec.processingStatus === "under_review" ? "Assigned" :
                   store.cases[idx].stage,
          };
          await writeStore(store);
        }
      }
      created++;
      if (created % 100 === 0) process.stdout.write(`   ✓ ${created} created...\r`);
    } catch (e) {
      errors++;
      if (errors <= 3) console.error(`   ✗ "${rec.client}" (${rec.formType}): ${e}`);
    }
  }

  console.log("\n\n══════════════════════════════════════════");
  console.log("  ✅  IMPORT COMPLETE");
  console.log(`  ✓  Created  : ${created} new cases`);
  console.log(`  ⏭   Skipped  : ${skipped} duplicates`);
  if (errors) console.log(`  ✗  Errors   : ${errors}`);
  console.log("══════════════════════════════════════════\n");

  const staffCount: Record<string, number> = {};
  records.forEach(r => { staffCount[r.assignedTo] = (staffCount[r.assignedTo] || 0) + 1; });
  console.log("Cases per staff member:");
  Object.entries(staffCount).sort((a,b) => b[1]-a[1]).forEach(([n,c]) => {
    console.log(`  ${n.padEnd(22)} ${c}`);
  });
}

run().catch(err => { console.error("Fatal:", err); process.exit(1); });
