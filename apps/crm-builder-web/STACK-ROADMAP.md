# Stack Roadmap (Requested Production Stack)

## Current MVP (implemented now)
- Frontend: Next.js app router
- Backend: Next.js route handlers
- Storage: local JSON store (`data/store.json`)
- Realtime: polling (4s) for chat updates

## Requested Production Stack
- Frontend: Next.js
- Backend API: Node.js + Express
- Database: PostgreSQL (Supabase)
- Realtime Chat: Socket.io
- File Storage: Supabase Storage or AWS S3
- Auth: Supabase Auth or Firebase Auth
- Payments: Stripe
- Hosting: Vercel (frontend) + Railway (Express API)

## Migration Steps
1. Move `lib/store.ts` logic into Express services + repositories.
2. Replace JSON store with Supabase Postgres schema.
3. Replace polling chat with Socket.io rooms per case.
4. Replace demo auth with Supabase/Firebase JWT.
5. Replace static links with signed upload URLs (S3/Supabase Storage).
6. Add Stripe invoices + webhooks for payment status updates.

## Palette (active default)
- Primary: `#1E3A8A`
- Secondary: `#6366F1`
- Success: `#10B981`
- Background: `#F8FAFC`
- Text: `#111827`

Each company can now override branding in Team -> Branding.
