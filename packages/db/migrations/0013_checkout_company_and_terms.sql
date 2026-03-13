ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "company_name" varchar(160);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "terms_accepted_at" timestamptz;
