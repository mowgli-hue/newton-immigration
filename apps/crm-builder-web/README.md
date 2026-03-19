# FlowDesk CRM Builder (MVP)

This app is a starting point for a configurable CRM + client portal platform.

## Run

```bash
npm run dev --workspace @jungle/crm-builder-web
```

Runs on [http://localhost:3006](http://localhost:3006).

## Current MVP Scope

- Visual workflow strip for operations lifecycle
- Login/logout with role-aware view (`Admin`, `Owner`, `Reviewer`)
- Multi-company signup (`Create New Company`)
- Staff CRM + Client Portal account experiences
- Company slug route for portal (`/portal/[slug]`)
- Persistent case storage via local JSON file
- Pipeline board for case stages
- Stage updates directly from case table
- Auto-assignment and review queue panels
- Real message records per case (staff/client/AI)
- Real document records per case
- Service packages, milestones, and invoice history per client case
- Company branding editor (app name + palette)
- Polling-based live chat refresh (every 4 seconds)
- Team management: invite member, role set, password reset (Admin)

## Demo Login

- `admin@flowdesk.local` / `admin123`
- `owner@flowdesk.local` / `owner123`
- `reviewer@flowdesk.local` / `reviewer123`
- `client@flowdesk.local` / `client123`

## API Endpoints

- `POST /api/companies/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET/POST /api/cases`
- `GET/PATCH /api/cases/:id`
- `GET/POST /api/cases/:id/messages`
- `GET/POST /api/cases/:id/documents`
- `PATCH/POST /api/cases/:id/financials`
- `GET/POST /api/users`
- `PATCH /api/users/:id/password`
- `GET/PATCH /api/company`

## Storage

- App data persists at `apps/crm-builder-web/data/store.json`
- See `STACK-ROADMAP.md` for migration path to Express + Supabase + Socket.io + Stripe.

## Connect To Express API

Set in `apps/crm-builder-web/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3011/api/v1
```

If not set, frontend falls back to internal Next API routes.

## Next Engineering Steps

- Add persistent DB (PostgreSQL)
- Add auth and roles
- Build tenant-level form/pipeline builder
- Build client portal messaging and document upload
- Connect Stripe + DocuSign/Dropbox Sign webhooks
