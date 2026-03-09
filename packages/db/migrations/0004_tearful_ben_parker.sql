ALTER TABLE "products" ADD COLUMN "woo_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "visibility_status" varchar(20) DEFAULT 'publish' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" varchar(120);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "ean" varchar(64);