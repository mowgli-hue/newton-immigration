# Start Here - Jungle Labs MVP

## 1. Install prerequisites (macOS)
If Node is missing, install:

```bash
brew install node@22
```

Then reopen terminal and verify:

```bash
node -v
npm -v
```

Also install PostgreSQL (if needed):

```bash
brew install postgresql@16
brew services start postgresql@16
```

## 2. Install dependencies
From project root:

```bash
npm install
```

## 3. Prepare environment
```bash
cp apps/api-server/.env.example apps/api-server/.env
```

Create database:

```bash
createdb jungle_labs
```

Run schema and seed:

```bash
psql postgres://postgres@localhost:5432/jungle_labs -f apps/api-server/sql/001_init.sql
psql postgres://postgres@localhost:5432/jungle_labs -f apps/api-server/sql/002_seed.sql
psql postgres://postgres@localhost:5432/jungle_labs -f apps/api-server/sql/003_order_item_modifiers.sql
```

If your local postgres user/password differs, update `DATABASE_URL` in `apps/api-server/.env`.

## 4. Run API server
```bash
npm run dev:api

# If watch mode has environment permission issues:
npm run dev:api:nowatch

# If port 4000 is busy:
PORT=4010 npm run dev:api:nowatch
```

Test health:

```bash
curl http://localhost:4000/health
```

Test menu:

```bash
curl http://localhost:4000/api/v1/menu
curl http://localhost:4000/api/v1/tables
```

## 5. Run tablet app
```bash
cp apps/tablet-app/.env.local.example apps/tablet-app/.env.local
npm run dev:tablet
```

Open:

```bash
http://localhost:3001
```

If API is running on another port (for example 4010), set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4010
```

in `apps/tablet-app/.env.local`.

## 6. Implemented in current code
- API: menu, tables, create order, order detail, status update, KDS list, staff calls, split preview, pay order.
- Tablet app: menu browse, cart, table selection, place order.
- SQL: base schema + seed + order item modifiers table.

## 7. Existing generated structure
- `apps/api-server`: backend starter with v1 routes.
- `apps/api-server/sql`: initial schema + seed.
- `apps/tablet-app`: working Next.js tablet MVP screen.
- `apps/admin-kds-web`: admin/KDS placeholder package.
- `MVP-PRD.md`: full requirements and acceptance criteria.
