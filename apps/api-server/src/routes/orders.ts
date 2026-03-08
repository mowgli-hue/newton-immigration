import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { broadcast } from "../ws.js";

export const ordersRouter = Router();
const TAX_RATE = 0.13;

const createOrderSchema = z.object({
  table_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        menu_item_id: z.string().uuid(),
        qty: z.number().int().positive()
      })
    )
    .min(1)
});

const payOrderSchema = z.object({
  amount_cents: z.number().int().positive(),
  tip_cents: z.number().int().min(0).default(0),
  provider: z.string().min(1).default("tablet"),
  provider_ref: z.string().optional()
});

const splitPreviewSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("equal"),
    people_count: z.number().int().min(2)
  }),
  z.object({
    mode: z.literal("manual"),
    amounts_cents: z.array(z.number().int().positive()).min(2)
  })
]);

ordersRouter.post("/orders", async (req, res, next) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const tableResult = await client.query(
      `SELECT id FROM restaurant_tables WHERE id = $1 AND is_active = true`,
      [parsed.data.table_id]
    );

    if (!tableResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid or inactive table_id." });
    }

    const uniqueItemIds = [...new Set(parsed.data.items.map((item) => item.menu_item_id))];
    const menuItemsResult = await client.query(
      `
      SELECT id, name, price_cents
      FROM menu_items
      WHERE id = ANY($1::uuid[]) AND is_active = true
      `,
      [uniqueItemIds]
    );

    if (menuItemsResult.rowCount !== uniqueItemIds.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "One or more menu items are invalid or inactive." });
    }

    const menuItemMap = new Map(
      menuItemsResult.rows.map((row) => [row.id as string, { name: row.name as string, priceCents: row.price_cents as number }])
    );

    const insertOrder = await client.query(
      `
      INSERT INTO orders (table_id, order_number, status, subtotal_cents, tax_cents, tip_cents, discount_cents, total_cents, payment_status, placed_at)
      VALUES ($1, CONCAT('JL-', FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::bigint, '-', FLOOR(RANDOM() * 900 + 100)::int), 'Placed', 0, 0, 0, 0, 0, 'pending', NOW())
      RETURNING id, order_number, status, table_id;
      `,
      [parsed.data.table_id]
    );

    const order = insertOrder.rows[0];
    let subtotalCents = 0;

    for (const item of parsed.data.items) {
      const menuItem = menuItemMap.get(item.menu_item_id);
      if (!menuItem) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Menu item lookup failed during order creation." });
      }

      const lineTotalCents = menuItem.priceCents * item.qty;
      subtotalCents += lineTotalCents;

      await client.query(
        `
        INSERT INTO order_items (order_id, menu_item_id, item_name_snapshot, unit_price_cents, qty, line_total_cents)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [order.id, item.menu_item_id, menuItem.name, menuItem.priceCents, item.qty, lineTotalCents]
      );
    }

    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const totalCents = subtotalCents + taxCents;

    const updatedOrderResult = await client.query(
      `
      UPDATE orders
      SET subtotal_cents = $1, tax_cents = $2, total_cents = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, order_number, status, table_id, subtotal_cents, tax_cents, total_cents, payment_status
      `,
      [subtotalCents, taxCents, totalCents, order.id]
    );

    const updatedOrder = updatedOrderResult.rows[0];

    await client.query(
      `
      INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_role, changed_at)
      VALUES ($1, NULL, 'Placed', 'customer', NOW());
      `,
      [updatedOrder.id]
    );

    await client.query("COMMIT");

    broadcast("order.created", updatedOrder);
    res.status(201).json({ data: updatedOrder });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

ordersRouter.get("/orders/:id", async (req, res, next) => {
  try {
    const orderResult = await db.query(
      `
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.payment_status,
        o.subtotal_cents,
        o.tax_cents,
        o.tip_cents,
        o.discount_cents,
        o.total_cents,
        o.placed_at,
        o.completed_at,
        t.id AS table_id,
        t.table_code,
        t.display_name AS table_display_name
      FROM orders o
      INNER JOIN restaurant_tables t ON t.id = o.table_id
      WHERE o.id = $1
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!orderResult.rowCount) {
      return res.status(404).json({ error: "Order not found" });
    }

    const itemsResult = await db.query(
      `
      SELECT
        oi.id,
        oi.menu_item_id,
        oi.item_name_snapshot,
        oi.unit_price_cents,
        oi.qty,
        oi.line_total_cents,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oim.id,
              'modifier_name_snapshot', oim.modifier_name_snapshot,
              'price_delta_cents', oim.price_delta_cents,
              'qty', oim.qty
            )
            ORDER BY oim.created_at ASC
          ) FILTER (WHERE oim.id IS NOT NULL),
          '[]'::json
        ) AS modifiers
      FROM order_items oi
      LEFT JOIN order_item_modifiers oim ON oim.order_item_id = oi.id
      WHERE oi.order_id = $1
      GROUP BY oi.id
      ORDER BY oi.created_at ASC
      `,
      [req.params.id]
    );

    const statusHistoryResult = await db.query(
      `
      SELECT id, from_status, to_status, changed_by_role, changed_at
      FROM order_status_history
      WHERE order_id = $1
      ORDER BY changed_at ASC
      `,
      [req.params.id]
    );

    const order = orderResult.rows[0];
    return res.json({
      data: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        totals: {
          subtotal_cents: order.subtotal_cents,
          tax_cents: order.tax_cents,
          tip_cents: order.tip_cents,
          discount_cents: order.discount_cents,
          total_cents: order.total_cents
        },
        timing: {
          placed_at: order.placed_at,
          completed_at: order.completed_at
        },
        table: {
          id: order.table_id,
          table_code: order.table_code,
          display_name: order.table_display_name
        },
        items: itemsResult.rows,
        status_timeline: statusHistoryResult.rows
      }
    });
  } catch (error) {
    return next(error);
  }
});

ordersRouter.post("/orders/:id/pay", async (req, res, next) => {
  const parsed = payOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      SELECT id, status, subtotal_cents, tax_cents, discount_cents, payment_status
      FROM orders
      WHERE id = $1
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!orderResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0] as {
      id: string;
      status: string;
      subtotal_cents: number;
      tax_cents: number;
      discount_cents: number;
      payment_status: string;
    };

    if (order.payment_status === "authorized") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Order is already paid." });
    }

    const computedTotal =
      order.subtotal_cents +
      order.tax_cents +
      parsed.data.tip_cents -
      order.discount_cents;

    if (parsed.data.amount_cents !== computedTotal) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `amount_cents mismatch. Expected ${computedTotal}, received ${parsed.data.amount_cents}.`
      });
    }

    await client.query(
      `
      INSERT INTO payments (order_id, provider, provider_ref, amount_cents, status, paid_at)
      VALUES ($1, $2, $3, $4, 'authorized', NOW())
      `,
      [
        order.id,
        parsed.data.provider,
        parsed.data.provider_ref ?? null,
        parsed.data.amount_cents
      ]
    );

    const updatedOrderResult = await client.query(
      `
      UPDATE orders
      SET tip_cents = $1, total_cents = $2, payment_status = 'authorized', updated_at = NOW()
      WHERE id = $3
      RETURNING id, order_number, status, payment_status, subtotal_cents, tax_cents, tip_cents, discount_cents, total_cents
      `,
      [parsed.data.tip_cents, computedTotal, order.id]
    );

    await client.query("COMMIT");
    return res.json({ data: updatedOrderResult.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

ordersRouter.post("/orders/:id/split-preview", async (req, res, next) => {
  const parsed = splitPreviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const orderResult = await db.query(
      `
      SELECT id, total_cents
      FROM orders
      WHERE id = $1
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!orderResult.rowCount) {
      return res.status(404).json({ error: "Order not found" });
    }

    const totalCents = orderResult.rows[0].total_cents as number;

    if (parsed.data.mode === "equal") {
      const base = Math.floor(totalCents / parsed.data.people_count);
      const remainder = totalCents % parsed.data.people_count;
      const splits = Array.from({ length: parsed.data.people_count }).map(
        (_value, idx) => ({
          person: idx + 1,
          amount_cents: idx < remainder ? base + 1 : base
        })
      );

      return res.json({
        data: {
          mode: "equal",
          total_cents: totalCents,
          splits
        }
      });
    }

    const manualTotal = parsed.data.amounts_cents.reduce((sum, value) => sum + value, 0);
    if (manualTotal !== totalCents) {
      return res.status(400).json({
        error: `Manual split total mismatch. Expected ${totalCents}, received ${manualTotal}.`
      });
    }

    return res.json({
      data: {
        mode: "manual",
        total_cents: totalCents,
        splits: parsed.data.amounts_cents.map((amount, idx) => ({
          person: idx + 1,
          amount_cents: amount
        }))
      }
    });
  } catch (error) {
    return next(error);
  }
});
