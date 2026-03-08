import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { broadcast } from "../ws.js";

export const staffCallsRouter = Router();

const createCallSchema = z.object({
  table_id: z.string().uuid(),
  message: z.string().max(200).optional()
});

staffCallsRouter.get("/staff-calls", async (req, res, next) => {
  const includeResolved = req.query.include_resolved === "true";

  try {
    const query = `
      SELECT
        sc.id,
        sc.table_id,
        sc.status,
        sc.message,
        sc.opened_at,
        sc.resolved_at,
        t.table_code,
        t.display_name
      FROM staff_calls sc
      INNER JOIN restaurant_tables t ON t.id = sc.table_id
      WHERE ($1::boolean = true OR sc.status <> 'resolved')
      ORDER BY sc.opened_at DESC;
    `;

    const { rows } = await db.query(query, [includeResolved]);
    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
});

staffCallsRouter.post("/staff-calls", async (req, res, next) => {
  const parsed = createCallSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const existing = await db.query(
      "SELECT id FROM staff_calls WHERE table_id = $1 AND status IN ('open', 'acknowledged') LIMIT 1",
      [parsed.data.table_id]
    );

    if (existing.rowCount) {
      return res.status(409).json({ error: "An active call already exists for this table." });
    }

    const created = await db.query(
      `
      INSERT INTO staff_calls (table_id, status, message, opened_at)
      VALUES ($1, 'open', $2, NOW())
      RETURNING id, table_id, status, message, opened_at;
      `,
      [parsed.data.table_id, parsed.data.message ?? null]
    );

    broadcast("staff_call.created", created.rows[0]);
    return res.status(201).json({ data: created.rows[0] });
  } catch (error) {
    next(error);
  }
});

staffCallsRouter.post("/staff-calls/:id/resolve", async (req, res, next) => {
  try {
    const resolved = await db.query(
      "UPDATE staff_calls SET status = 'resolved', resolved_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id, table_id, status, resolved_at",
      [req.params.id]
    );

    if (!resolved.rowCount) {
      return res.status(404).json({ error: "Staff call not found" });
    }

    broadcast("staff_call.resolved", resolved.rows[0]);
    return res.json({ data: resolved.rows[0] });
  } catch (error) {
    next(error);
  }
});
