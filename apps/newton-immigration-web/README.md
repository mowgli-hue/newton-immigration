# Newton Immigration Web

Next.js (App Router) website for Newton Immigration with CRS tools, AI advisor, lead forms, and Stripe checkout.

## Run locally

```bash
npm install
npm run dev:newton-web
```

## Environment variables

Create `.env.local` in this app folder:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3004
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
LEAD_WEBHOOK_URL=
NEWS_API_KEY=
NEWS_API_PROVIDER=gnews
```

## Main routes

- `/` Home (hero, programs, Franco, news, AI chat, locations, YouTube)
- `/programs` and `/programs/[slug]`
- `/crs-calculator`
- `/pr-strategy-report`
- `/immigration-news`
- `/blog` and `/blog/[slug]`
- `/assessment`
- `/consultation`
- `/contact`
- `/about`

## API routes

- `POST /api/lead` (webhook dispatch)
- `POST /api/assessment` (assessment capture + optional webhook)
- `POST /api/ai-advisor` (advisor response logic)
- `POST /api/stripe/checkout` (Stripe Checkout session)
- `POST /api/stripe/webhook` (Stripe webhook verification)
- `GET /api/news` (live immigration news feed)
