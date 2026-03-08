# Jungle Labs Table Ordering System - MVP PRD

## 1. Product Goal
Build a stable, simple tablet-first ordering system for dine-in tables that improves speed of service and reduces staff load.

Primary success outcome for MVP:
- Customer can place and pay an order on a table tablet.
- Kitchen receives order instantly with table number.
- Customer sees live status updates and gets a ready-for-pickup notification.

## 2. MVP Scope (Locked)
In scope (Phase 1):
- Menu browsing
- Item customization (modifiers)
- Cart and checkout
- Payment on tablet
- Automatic table number tagging
- Kitchen order routing
- Live order status tracking
- Ready for pickup notification
- Split bill
- Tip on checkout
- Call waiter button
- Basic Admin dashboard (menu + price management)
- Basic KDS (Kitchen Display System)

Out of scope (Phase 2+):
- AI recommendations
- Games/entertainment
- Ads/sponsored listings
- Loyalty accounts
- Voice assistant
- Multi-location advanced controls

## 3. Users and Roles
1. Customer (tablet)
- Browses menu, customizes items, pays, tracks order, calls waiter.

2. Kitchen staff (KDS)
- Sees new orders, updates order status.

3. Front staff
- Responds to waiter calls and pickup flow.

4. Admin/Manager
- Manages menu, pricing, categories, and promotions (basic).

## 4. Core User Flows
### 4.1 Customer Order Flow
1. Tablet is assigned to table (or detected at session start).
2. Customer browses categories and items.
3. Customer opens item details, selects modifiers, adds quantity.
4. Customer reviews cart.
5. Optional: applies promo code.
6. Optional: chooses split bill.
7. Checkout: tip selection + payment.
8. Order is created with table number and sent to kitchen.
9. Customer sees status updates in real time.
10. At `Ready for Pickup`, tablet shows clear notification.

### 4.2 Kitchen Flow (KDS)
1. New order appears instantly with table number and timestamp.
2. Kitchen marks status:
- `Accepted`
- `Preparing`
- `Ready for Pickup`
- `Completed`
3. Each status update pushes live update to tablet.

### 4.3 Call Waiter Flow
1. Customer taps `Call Waiter`.
2. Staff dashboard gets alert with table number and timestamp.
3. Staff marks request resolved.

### 4.4 Admin Flow
1. Admin logs in to dashboard.
2. Admin creates/edits:
- Categories
- Menu items
- Modifier groups/options
- Prices
- Availability
3. Updates reflect in tablet app quickly (cache refresh + soft real-time sync).

## 5. UX Principles (MVP)
- Keep interactions simple and fast.
- No cluttered animations.
- Large tap targets for tablet use.
- Clear status language and visual progress.
- Never block customer without clear error + retry action.

## 6. Functional Requirements
### 6.1 Menu and Customization
- Menu organized by category.
- Item card shows name, price, photo (optional), short description.
- Item details support required and optional modifiers.
- Validate modifier constraints:
- Required selection count
- Max selection count
- Quantity per item

### 6.2 Cart and Checkout
- Add/remove/update item quantity.
- Show line-item totals and tax.
- Apply promo code (single code in MVP).
- Tip options: preset percentages + custom amount.

### 6.3 Split Bill
- Basic split modes:
- Equal split by number of payers
- Manual amount split
- Ensure total split equals payable amount.

### 6.4 Payment
- Support payment states:
- `pending`
- `authorized`
- `failed`
- `refunded` (admin-only for MVP)
- On successful payment, order moves to `Placed`.

### 6.5 Order Status
Canonical status chain:
- `Placed` -> `Accepted` -> `Preparing` -> `Ready for Pickup` -> `Completed`

Rules:
- No invalid backward jumps except admin override.
- Every status change must be stored in history table.

### 6.6 Call Waiter
- One active waiter call per table at a time.
- Statuses: `open`, `acknowledged`, `resolved`.

### 6.7 Admin Panel (Basic)
- Secure login.
- CRUD for menu categories/items/modifiers.
- Toggle item availability.

### 6.8 KDS (Basic)
- Real-time incoming orders.
- Sort by oldest first.
- Show elapsed timer per order.
- One-click status updates.

## 7. Non-Functional Requirements
- Tablet actions should feel responsive (<300ms UI response target for local interactions).
- API p95 response target: <500ms for core reads/writes.
- WebSocket reconnect on network drop.
- Idempotency key on order creation and payment endpoints.
- Full audit timestamps for critical entities.

## 8. Technical Architecture (Approved Stack)
- Frontend:
- Tablet App: Next.js app in tablet mode (PWA/fullscreen kiosk)
- Admin + KDS: Next.js web app

- Backend:
- Node.js with NestJS (recommended) or Express
- REST API + WebSocket gateway

- Database:
- PostgreSQL

- Real-time:
- WebSocket channels per table and kitchen/admin streams

## 9. Data Model (MVP)
Recommended tables:

1. `restaurant_tables`
- `id` (uuid, pk)
- `table_code` (text unique)
- `display_name` (text)
- `is_active` (bool)
- `created_at`, `updated_at`

2. `menu_categories`
- `id`, `name`, `sort_order`, `is_active`, timestamps

3. `menu_items`
- `id`, `category_id`, `name`, `description`, `price_cents`, `image_url`, `is_active`, timestamps

4. `modifier_groups`
- `id`, `menu_item_id`, `name`, `min_select`, `max_select`, timestamps

5. `modifier_options`
- `id`, `modifier_group_id`, `name`, `price_delta_cents`, `is_active`, timestamps

6. `orders`
- `id`
- `table_id`
- `order_number` (human-readable)
- `status` (enum)
- `subtotal_cents`, `tax_cents`, `tip_cents`, `discount_cents`, `total_cents`
- `payment_status` (enum)
- `placed_at`, `completed_at`
- timestamps

7. `order_items`
- `id`, `order_id`, `menu_item_id`, `item_name_snapshot`, `unit_price_cents`, `qty`, `line_total_cents`, timestamps

8. `order_item_modifiers`
- `id`, `order_item_id`, `modifier_name_snapshot`, `price_delta_cents`, `qty`, timestamps

9. `payments`
- `id`, `order_id`, `provider`, `provider_ref`, `amount_cents`, `status`, `paid_at`, timestamps

10. `promo_codes`
- `id`, `code`, `type` (percent/fixed), `value`, `is_active`, `starts_at`, `ends_at`, timestamps

11. `staff_calls`
- `id`, `table_id`, `status`, `message`, `opened_at`, `resolved_at`, timestamps

12. `order_status_history`
- `id`, `order_id`, `from_status`, `to_status`, `changed_by_role`, `changed_at`

## 10. API Contracts (v1)
### Menu
- `GET /api/v1/menu`
- Returns active categories, items, modifiers.

### Orders
- `POST /api/v1/orders`
- Creates order in `Placed` status.
- Body includes table, items, modifiers, promo, split context.

- `GET /api/v1/orders/:id`
- Order detail + status timeline.

- `POST /api/v1/orders/:id/status`
- KDS/admin updates status.

### Payments
- `POST /api/v1/orders/:id/pay`
- Initiates/confirms payment.

### Staff Calls
- `POST /api/v1/staff-calls`
- Create waiter call.

- `POST /api/v1/staff-calls/:id/resolve`
- Resolve waiter call.

### Admin
- `POST /api/v1/admin/menu-items`
- `PATCH /api/v1/admin/menu-items/:id`
- `PATCH /api/v1/admin/menu-items/:id/availability`

## 11. WebSocket Events
- `order.created`
- `order.status_changed`
- `staff_call.created`
- `staff_call.resolved`

Payload minimum:
- `event_id`, `timestamp`, `entity_id`, `table_id`, `status`, `order_number`

## 12. Acceptance Criteria (Must Pass)
1. Place Order E2E
- From tablet, customer places and pays order.
- KDS receives it in <3 seconds.
- Table number is visible in KDS.

2. Status Sync
- KDS marks `Ready for Pickup`.
- Tablet updates in real time without refresh.

3. Split Bill
- Equal split and manual split both compute exact totals.

4. Call Waiter
- Alert appears in staff dashboard with correct table.

5. Admin Menu Update
- Changing item price in admin is visible on tablet after refresh/sync.

## 13. Build Plan (4 Sprints)
### Sprint 1
- Monorepo setup
- Auth scaffold (admin/kitchen)
- Menu read APIs
- Tablet menu + cart UI

### Sprint 2
- Order creation API
- Payment integration (sandbox)
- KDS new order feed
- Order status model + history

### Sprint 3
- Real-time websocket sync
- Split bill
- Tip flow
- Call waiter flow

### Sprint 4
- Admin CRUD for menu
- Reliability hardening
- QA/UAT + pilot rollout (2-3 tables)

## 14. Risks and Mitigations
1. Network instability
- Add retry queues and websocket reconnect.

2. Payment edge cases
- Use idempotency keys and explicit failure recovery UI.

3. Kitchen operational mismatch
- Pilot with staff feedback before full deployment.

4. Scope creep
- Enforce locked MVP checklist before adding phase 2 ideas.

## 15. Day-1 Engineering Checklist
1. Initialize repo structure:
- `/apps/tablet-app`
- `/apps/admin-kds-web`
- `/apps/api-server`

2. Set up PostgreSQL + migrations.
3. Implement menu schema and seed script.
4. Build `GET /menu` and tablet menu rendering.
5. Build order create endpoint and basic KDS list view.
6. Add websocket event for `order.created`.
7. Validate full flow with one test table.

---

Owner: Jungle Labs
Document version: v1.0 (MVP Locked)
