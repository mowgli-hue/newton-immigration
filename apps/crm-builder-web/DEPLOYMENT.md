# Newton CRM Deployment

## Recommended for Tomorrow Launch (Stable + Simple)

Deploy `crm-builder-web` as a single Node service on Railway with persistent volume.
This keeps all current features working (invites, questionnaires, checklists, docs, intake PDF, Drive upload) without breaking routes.

## 1) Railway Deploy

1. Push code to GitHub.
2. In Railway -> `New Project` -> `Deploy from GitHub`.
3. Select repo and set **Root Directory**:
   - `apps/crm-builder-web`
4. Build command:
   - `npm ci && npm run build`
5. Start command:
   - `npm run start`

## 2) Add Persistent Volume

1. In Railway service -> `Volumes` -> `New Volume`.
2. Mount path:
   - `/data`
3. Environment variables:
   - `FLOWDESK_DATA_DIR=/data`
   - `FLOWDESK_STORE_PATH=/data/store.json`
   - `NEXT_PUBLIC_APP_URL=https://crm.newtonimmigration.com`
   - `APP_BASE_URL=https://crm.newtonimmigration.com`
   - `NEXT_PUBLIC_INTERAC_RECIPIENT=newtonimmigration@gmail.com`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL=...`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=...`

## 3) Connect Domain

1. In Railway -> service -> `Settings` -> `Domains` -> add:
   - `crm.newtonimmigration.com`
2. Add DNS CNAME in your domain provider:
   - Host: `crm`
   - Value: Railway provided target
3. Wait for SSL to become active.

## 4) Launch Checklist

1. Open `https://crm.newtonimmigration.com/portal/newton`
2. Create test case + invite.
3. Submit questionnaire:
   - verify intake save works
   - verify intake PDF generated/uploaded to Drive
4. Upload test document:
   - verify it appears in Drive case folder
5. Confirm staff can log in and see same data after service restart.

## Notes

- Current storage is now configurable via `FLOWDESK_STORE_PATH` and can persist on mounted volume.
- For later scale/multi-instance, move to Supabase/Postgres for full DB-backed storage.

## Phase 2: PostgreSQL Cutover (Staged, No Big-Bang)

### New Environment Variables

- `DATA_BACKEND=file|postgres`
- `DATABASE_URL=postgres://...`
- keep:
  - `FLOWDESK_DATA_DIR=/data`
  - `FLOWDESK_STORE_PATH=/data/store.json`

### Migration Commands

From `apps/crm-builder-web`:

1. Backup current JSON store:
   - `npm run db:export:store`
2. Apply schema to PostgreSQL:
   - `npm run db:migrate:init`
3. Migrate JSON data into PostgreSQL:
   - `npm run db:migrate:store`

### Staging Rollout

1. Clone production data volume snapshot or use latest backup.
2. Run migration commands in **staging**.
3. Set `DATA_BACKEND=postgres` in staging only.
4. Verify:
   - login
   - create case
   - invite
   - docs
   - results
   - communications logs

### Production Rollout

1. Freeze deployments briefly.
2. Run backup + migrate commands on latest data.
3. Set `DATA_BACKEND=postgres`.
4. Redeploy.
5. Keep file backup for rollback.

### Readiness Endpoint

Admin can verify storage posture:
- `GET /api/system/readiness`
