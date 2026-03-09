ALTER TABLE "orders" ADD COLUMN "shipping_method" varchar(60);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimated_delivery_days" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_cost" numeric(12, 2);