ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_number" varchar(40);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_status" varchar(30) NOT NULL DEFAULT 'pending_payment';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" varchar(30) NOT NULL DEFAULT 'pending';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_status" varchar(30) NOT NULL DEFAULT 'unfulfilled';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_name" varchar(120);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_address1" varchar(200);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_address2" varchar(200);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_city" varchar(120);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_zip" varchar(30);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_name" varchar(120);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address1" varchar(200);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address2" varchar(200);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_city" varchar(120);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_zip" varchar(30);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_country" varchar(2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_notes" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_amount" numeric(12, 2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(12, 2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tax_amount" numeric(12, 2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_code" varchar(40);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" varchar(40);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "expired_at" timestamptz;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "canceled_at" timestamptz;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipped_at" timestamptz;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivered_at" timestamptz;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "returned_at" timestamptz;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "completed_at" timestamptz;

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant" varchar(160);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "options_json" jsonb;

CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "provider" varchar(40) NOT NULL DEFAULT 'btcpay',
  "invoice_id" varchar(120),
  "tx_id" varchar(160),
  "amount" numeric(12, 2) NOT NULL,
  "currency" varchar(3) NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'pending',
  "raw_json" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "paid_at" timestamptz,
  "expired_at" timestamptz,
  "refunded_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "order_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "type" varchar(80) NOT NULL,
  "message" text,
  "payload" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_number_unique" ON "orders" ("order_number");
CREATE INDEX IF NOT EXISTS "payments_order_id_idx" ON "payments" ("order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_invoice_idx" ON "payments" ("provider", "invoice_id");
CREATE INDEX IF NOT EXISTS "order_events_order_id_idx" ON "order_events" ("order_id");

UPDATE "orders"
SET
  "order_number" = COALESCE("order_number", 'CC-' || upper(replace(substring("id"::text, 1, 8), '-', ''))),
  "order_status" = COALESCE("status", "order_status"),
  "payment_status" = CASE
    WHEN "status" IN ('paid', 'confirmed', 'fulfilled') THEN 'paid'
    WHEN "status" IN ('cancelled') THEN 'canceled'
    ELSE COALESCE("payment_status", 'pending')
  END,
  "fulfillment_status" = CASE
    WHEN "status" IN ('fulfilled') THEN 'fulfilled'
    WHEN "status" IN ('cancelled') THEN 'canceled'
    ELSE COALESCE("fulfillment_status", 'unfulfilled')
  END,
  "shipping_amount" = COALESCE("shipping_amount", "shipping_cost", 0),
  "discount_amount" = COALESCE("discount_amount", 0),
  "tax_amount" = COALESCE("tax_amount", 0),
  "payment_method" = COALESCE("payment_method", 'btcpay')
WHERE TRUE;
