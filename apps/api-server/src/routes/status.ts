import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ORDER_STATUS_CHAIN, type OrderStatus } from "../lib/types.js";
import { broadcast } from "../ws.js";

export const statusRouter = Router();

const statusSchema = z.object({
  status: z.enum(["Placed", "Accepted", "Preparing", "Ready for Pickup", "Completed"]),
  changed_by_role: z.enum(["kitchen", "admin", "system"]).default("kitchen")
});

function canTransition(current: OrderStatus, next: OrderStatus) {
  return ORDER_STATUS_CHAIN.indexOf(next) >= ORDER_STATUS_CHAIN.indexOf(current);
}

statusRouter.post("/orders/:id/status", async (req, res, next) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const current = await db.query("SELECT id, status, table_id, order_number FROM orders WHERE id = $1", [req.params.id]);

    if (!current.rowCount) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = current.rows[0] as {
      id: string;
      status: OrderStatus;
      table_id: string;
      order_number: string;
    };

    const nextStatus = parsed.data.status as OrderStatus;

    if (!canTransition(order.status, nextStatus)) {
      return res.status(409).json({ error: `Invalid transition from ${order.status} to ${nextStatus}` });
    }

    await db.query("UPDATE orders SET status = $1, completed_at = CASE WHEN $1 = 'Completed' THEN NOW() ELSE completed_at END, updated_at = NOW() WHERE id = $2", [nextStatus, order.id]);

    await db.query(
      "INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_role, changed_at) VALUES ($1, $2, $3, $4, NOW())",
      [order.id, order.status, nextStatus, parsed.data.changed_by_role]
    );

    const payload = {
      order_id: order.id,
      order_number: order.order_number,
      table_id: order.table_id,
      status: nextStatus
    };

    broadcast("order.status_changed", payload);
    return res.json({ data: payload });
  } catch (error) {
    next(error);
  }
});
