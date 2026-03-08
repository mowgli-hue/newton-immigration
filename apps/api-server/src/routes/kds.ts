import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";

export const kdsRouter = Router();

const kdsQuerySchema = z.object({
  status: z.enum(["Placed", "Accepted", "Preparing", "Ready for Pickup", "Completed"]).optional(),
  include_completed: z.enum(["true", "false"]).optional()
});

kdsRouter.get("/kds/orders", async (req, res, next) => {
  const parsed = kdsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const status = parsed.data.status ?? null;
  const includeCompleted = parsed.data.include_completed === "true";

  try {
    const query = `
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.placed_at,
        o.subtotal_cents,
        o.tax_cents,
        o.total_cents,
        t.table_code,
        t.display_name,
        COALESCE(
          json_agg(
            json_build_object(
              'order_item_id', oi.id,
              'menu_item_id', oi.menu_item_id,
              'name', oi.item_name_snapshot,
              'unit_price_cents', oi.unit_price_cents,
              'qty', oi.qty,
              'line_total_cents', oi.line_total_cents
            )
            ORDER BY oi.created_at ASC
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      INNER JOIN restaurant_tables t ON t.id = o.table_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE ($1::order_status IS NULL OR o.status = $1)
        AND ($2::boolean = true OR o.status <> 'Completed')
      GROUP BY o.id, t.table_code, t.display_name
      ORDER BY o.placed_at ASC;
    `;

    const { rows } = await db.query(query, [status, includeCompleted]);
    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
});
