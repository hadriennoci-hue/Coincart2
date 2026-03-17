ALTER TABLE "products" ADD COLUMN "collection" varchar(120);

UPDATE "products"
SET "collection" = "category"
WHERE "collection" IS NULL
  AND "category" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "products_collection_idx" ON "products" ("collection");
