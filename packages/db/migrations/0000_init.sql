CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sku" varchar(120) NOT NULL UNIQUE,
  "slug" varchar(160) NOT NULL UNIQUE,
  "name" varchar(220) NOT NULL,
  "description" text,
  "image_url" text,
  "featured" boolean NOT NULL DEFAULT false,
  "stock_qty" integer NOT NULL DEFAULT 0,
  "last_seen_sync_job_id" uuid,
  "last_seen_in_feed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "product_prices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "currency" varchar(3) NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("product_id", "currency")
);

CREATE TABLE IF NOT EXISTS "sync_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source" varchar(100) NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'running',
  "started_at" timestamptz NOT NULL DEFAULT now(),
  "finished_at" timestamptz,
  "items_seen" integer NOT NULL DEFAULT 0,
  "out_of_stock_applied" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_email" varchar(320) NOT NULL,
  "customer_phone" varchar(30),
  "currency" varchar(3) NOT NULL,
  "subtotal_amount" numeric(12,2) NOT NULL,
  "total_amount" numeric(12,2) NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'pending_payment',
  "btcpay_invoice_id" varchar(120),
  "btcpay_checkout_url" text,
  "paid_at" timestamptz,
  "confirmed_at" timestamptz,
  "fulfilled_at" timestamptz,
  "cancelled_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "sku" varchar(120) NOT NULL,
  "product_name" varchar(220) NOT NULL,
  "unit_price" numeric(12,2) NOT NULL,
  "quantity" integer NOT NULL,
  "line_total" numeric(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key_id" varchar(80) NOT NULL UNIQUE,
  "secret" varchar(128) NOT NULL,
  "label" varchar(120) NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "request_nonces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nonce" varchar(120) NOT NULL,
  "key_id" varchar(80) NOT NULL,
  "seen_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("key_id", "nonce")
);

CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" varchar(40) NOT NULL,
  "delivery_id" varchar(120) NOT NULL UNIQUE,
  "event_type" varchar(120) NOT NULL,
  "payload" text NOT NULL,
  "processed_at" timestamptz NOT NULL DEFAULT now()
);