INSERT INTO restaurant_tables (table_code, display_name)
VALUES ('T1', 'Table 1'), ('T2', 'Table 2')
ON CONFLICT (table_code) DO NOTHING;

INSERT INTO menu_categories (name, sort_order)
VALUES ('Chai', 1), ('Snacks', 2)
ON CONFLICT DO NOTHING;

WITH chai_category AS (
  SELECT id FROM menu_categories WHERE name = 'Chai' LIMIT 1
),
snacks_category AS (
  SELECT id FROM menu_categories WHERE name = 'Snacks' LIMIT 1
)
INSERT INTO menu_items (category_id, name, description, price_cents)
SELECT id, 'Masala Chai', 'Traditional spiced tea', 399 FROM chai_category
UNION ALL
SELECT id, 'Ginger Chai', 'Fresh ginger infused chai', 449 FROM chai_category
UNION ALL
SELECT id, 'Samosa Plate', 'Two samosas with chutney', 699 FROM snacks_category
ON CONFLICT DO NOTHING;
