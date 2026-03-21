#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const flowdeskDataDir = process.env.FLOWDESK_DATA_DIR;
const flowdeskStorePath = process.env.FLOWDESK_STORE_PATH;
const localDefault = path.resolve(process.cwd(), "data/store.json");
const dataDirPath = flowdeskDataDir ? path.join(flowdeskDataDir, "store.json") : localDefault;
const sourcePath = flowdeskStorePath || dataDirPath;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
if (!fs.existsSync(sourcePath)) {
  console.error(`Store file not found: ${sourcePath}`);
  process.exit(1);
}

const raw = fs.readFileSync(sourcePath, "utf8");
const store = JSON.parse(raw);

const { Client } = await import("pg");
const client = new Client({ connectionString: databaseUrl });
await client.connect();

async function run() {
  const schemaSql = fs.readFileSync(path.resolve(process.cwd(), "db/schema.sql"), "utf8");
  await client.query("begin");
  try {
    await client.query(schemaSql);

    for (const c of store.companies || []) {
      await client.query(
        `insert into companies (id, name, slug, branding, created_at)
         values ($1,$2,$3,$4::jsonb,$5::timestamptz)
         on conflict (id) do update set
           name=excluded.name, slug=excluded.slug, branding=excluded.branding`,
        [c.id, c.name, c.slug, JSON.stringify(c.branding || {}), c.createdAt || new Date().toISOString()]
      );
    }

    for (const u of store.users || []) {
      await client.query(
        `insert into users (
           id, company_id, name, email, role, user_type, active, password_hash,
           workspace_drive_link, workspace_drive_folder_id, case_id
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (id) do update set
           company_id=excluded.company_id, name=excluded.name, email=excluded.email, role=excluded.role,
           user_type=excluded.user_type, active=excluded.active, password_hash=excluded.password_hash,
           workspace_drive_link=excluded.workspace_drive_link, workspace_drive_folder_id=excluded.workspace_drive_folder_id,
           case_id=excluded.case_id`,
        [
          u.id,
          u.companyId,
          u.name,
          u.email,
          u.role,
          u.userType,
          u.active !== false,
          u.password,
          u.workspaceDriveLink || null,
          u.workspaceDriveFolderId || null,
          u.caseId || null
        ]
      );
    }

    for (const c of store.clients || []) {
      await client.query(
        `insert into clients (
           id, company_id, client_code, full_name, phone, email, assigned_to, internal_flags, created_at, updated_at
         ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::timestamptz,$10::timestamptz)
         on conflict (id) do update set
           company_id=excluded.company_id, client_code=excluded.client_code, full_name=excluded.full_name,
           phone=excluded.phone, email=excluded.email, assigned_to=excluded.assigned_to,
           internal_flags=excluded.internal_flags, updated_at=excluded.updated_at`,
        [
          c.id,
          c.companyId,
          c.clientCode,
          c.fullName,
          c.phone || null,
          c.email || null,
          c.assignedTo || null,
          JSON.stringify(c.internalFlags || {}),
          c.createdAt || new Date().toISOString(),
          c.updatedAt || c.createdAt || new Date().toISOString()
        ]
      );
    }

    for (const c of store.cases || []) {
      await client.query(
        `insert into cases (
           id, company_id, client_id, client_user_id, client_name, form_type, assigned_to, owner_name, reviewer_name,
           stage, case_status, ai_status, lead_phone, lead_email, processing_status, processing_status_other,
           payment_status, amount_paid, balance_amount, is_urgent, deadline_date, decision_date, final_outcome, remarks,
           payload, created_at, updated_at
         ) values (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
           $17,$18,$19,$20,$21,$22,$23,$24,$25::jsonb,$26::timestamptz,$27::timestamptz
         )
         on conflict (id) do update set
           company_id=excluded.company_id, client_id=excluded.client_id, client_user_id=excluded.client_user_id,
           client_name=excluded.client_name, form_type=excluded.form_type, assigned_to=excluded.assigned_to,
           owner_name=excluded.owner_name, reviewer_name=excluded.reviewer_name, stage=excluded.stage,
           case_status=excluded.case_status, ai_status=excluded.ai_status, lead_phone=excluded.lead_phone,
           lead_email=excluded.lead_email, processing_status=excluded.processing_status,
           processing_status_other=excluded.processing_status_other, payment_status=excluded.payment_status,
           amount_paid=excluded.amount_paid, balance_amount=excluded.balance_amount, is_urgent=excluded.is_urgent,
           deadline_date=excluded.deadline_date, decision_date=excluded.decision_date, final_outcome=excluded.final_outcome,
           remarks=excluded.remarks, payload=excluded.payload, updated_at=excluded.updated_at`,
        [
          c.id,
          c.companyId,
          c.clientId || null,
          c.clientUserId || null,
          c.client,
          c.formType,
          c.assignedTo || null,
          c.owner || null,
          c.reviewer || null,
          c.stage,
          c.caseStatus || null,
          c.aiStatus || null,
          c.leadPhone || null,
          c.leadEmail || null,
          c.processingStatus || null,
          c.processingStatusOther || null,
          c.paymentStatus || null,
          c.amountPaid ?? null,
          c.balanceAmount ?? null,
          Boolean(c.isUrgent),
          c.deadlineDate || null,
          c.decisionDate || null,
          c.finalOutcome || null,
          c.remarks || null,
          JSON.stringify(c),
          c.createdAt || new Date().toISOString(),
          c.updatedAt || c.createdAt || new Date().toISOString()
        ]
      );
    }

    async function upsertList(items, table, cols, valuesBuilder) {
      for (const item of items || []) {
        const values = valuesBuilder(item);
        const columns = cols.join(", ");
        const params = cols.map((_, i) => `$${i + 1}`).join(", ");
        await client.query(
          `insert into ${table} (${columns}) values (${params}) on conflict do nothing`,
          values
        );
      }
    }

    await upsertList(
      store.messages,
      "messages",
      ["id", "company_id", "case_id", "sender_type", "sender_name", "text", "created_at"],
      (m) => [m.id, m.companyId, m.caseId, m.senderType, m.senderName, m.text, m.createdAt || new Date().toISOString()]
    );
    await upsertList(
      store.outboundMessages,
      "outbound_messages",
      ["id", "company_id", "case_id", "channel", "status", "target", "message", "created_by_user_id", "created_by_name", "created_at"],
      (m) => [
        m.id,
        m.companyId,
        m.caseId,
        m.channel,
        m.status,
        m.target || null,
        m.message,
        m.createdByUserId,
        m.createdByName,
        m.createdAt || new Date().toISOString()
      ]
    );
    await upsertList(
      store.documents,
      "documents",
      ["id", "company_id", "case_id", "client_id", "name", "category", "file_type", "version", "version_group_id", "status", "link", "created_at"],
      (d) => [
        d.id,
        d.companyId,
        d.caseId,
        d.clientId || null,
        d.name,
        d.category || null,
        d.fileType || null,
        d.version || 1,
        d.versionGroupId || d.id,
        d.status,
        d.link,
        d.createdAt || new Date().toISOString()
      ]
    );
    await upsertList(
      store.tasks,
      "tasks",
      ["id", "company_id", "case_id", "title", "description", "assigned_to", "created_by", "priority", "status", "due_date", "created_at"],
      (t) => [
        t.id,
        t.companyId,
        t.caseId,
        t.title,
        t.description,
        t.assignedTo,
        t.createdBy,
        t.priority,
        t.status,
        t.dueDate || null,
        t.createdAt || new Date().toISOString()
      ]
    );
    await upsertList(
      store.notifications,
      "notifications",
      ["id", "company_id", "user_id", "type", "message", "read", "created_at"],
      (n) => [n.id, n.companyId, n.userId, n.type, n.message, Boolean(n.read), n.createdAt || new Date().toISOString()]
    );
    await upsertList(
      store.invites,
      "invites",
      ["token", "company_id", "case_id", "email", "created_by_user_id", "used_by_user_id", "status", "expires_at", "created_at", "accepted_at"],
      (i) => [
        i.token,
        i.companyId,
        i.caseId,
        i.email || null,
        i.createdByUserId,
        i.usedByUserId || null,
        i.status,
        i.expiresAt,
        i.createdAt || new Date().toISOString(),
        i.acceptedAt || null
      ]
    );
    await upsertList(
      store.auditLogs,
      "audit_logs",
      ["id", "company_id", "actor_user_id", "actor_name", "action", "resource_type", "resource_id", "metadata", "created_at"],
      (a) => [
        a.id,
        a.companyId,
        a.actorUserId,
        a.actorName,
        a.action,
        a.resourceType,
        a.resourceId,
        JSON.stringify(a.metadata || {}),
        a.createdAt || new Date().toISOString()
      ]
    );
    await upsertList(
      store.clientCommunications,
      "client_communications",
      ["id", "company_id", "client_id", "created_by_user_id", "created_by_name", "type", "message", "created_at"],
      (c) => [
        c.id,
        c.companyId,
        c.clientId,
        c.createdByUserId,
        c.createdByName,
        c.type,
        c.message,
        c.createdAt || new Date().toISOString()
      ]
    );
    await upsertList(
      store.sessions,
      "sessions",
      ["token", "user_id", "company_id", "expires_at", "created_at"],
      (s) => [s.token, s.userId, s.companyId, s.expiresAt, new Date().toISOString()]
    );

    await client.query("commit");
    console.log("Migration completed successfully.");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

try {
  await run();
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await client.end();
}

