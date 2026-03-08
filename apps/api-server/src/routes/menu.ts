import { Router } from "express";
import { db } from "../lib/db.js";

export const menuRouter = Router();

menuRouter.get("/menu", async (_req, res, next) => {
  try {
    const query = `
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        c.sort_order,
        i.id AS item_id,
        i.name AS item_name,
        i.description,
        i.price_cents,
        i.image_url,
        i.is_active
      FROM menu_categories c
      LEFT JOIN menu_items i ON i.category_id = c.id
      WHERE c.is_active = true
      ORDER BY c.sort_order ASC, i.name ASC;
    `;

    const { rows } = await db.query(query);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

menuRouter.get("/tables", async (_req, res, next) => {
  try {
    const query = `
      SELECT id, table_code, display_name
      FROM restaurant_tables
      WHERE is_active = true
      ORDER BY table_code ASC;
    `;

    const { rows } = await db.query(query);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});
