ALTER TABLE "products" ADD COLUMN "parent_product_id" uuid;
ALTER TABLE "products" ADD COLUMN "is_variant" boolean DEFAULT false NOT NULL;
ALTER TABLE "products" ADD COLUMN "option_name" varchar(120);
ALTER TABLE "products" ADD COLUMN "option_value" varchar(160);

ALTER TABLE "products"
  ADD CONSTRAINT "products_parent_product_id_products_id_fk"
  FOREIGN KEY ("parent_product_id")
  REFERENCES "public"."products"("id")
  ON DELETE cascade
  ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "products_parent_product_id_idx" ON "products" ("parent_product_id");
CREATE INDEX IF NOT EXISTS "products_is_variant_idx" ON "products" ("is_variant");
