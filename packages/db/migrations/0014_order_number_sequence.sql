CREATE SEQUENCE IF NOT EXISTS "orders_order_number_seq"
  START WITH 100
  INCREMENT BY 1
  MINVALUE 100;

ALTER TABLE "orders"
ALTER COLUMN "order_number" SET DEFAULT nextval('orders_order_number_seq')::text;

UPDATE "orders"
SET "order_number" = nextval('orders_order_number_seq')::text
WHERE "order_number" IS NULL OR "order_number" !~ '^[0-9]+$';

SELECT setval(
  'orders_order_number_seq',
  GREATEST(
    COALESCE((SELECT MAX(("order_number")::bigint) FROM "orders" WHERE "order_number" ~ '^[0-9]+$'), 99),
    99
  ),
  true
);
