ALTER TABLE "products" ADD COLUMN "category" varchar(120);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cpu" varchar(120);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gpu" varchar(120);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "keyboard_layout" varchar(30);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "usage" varchar(60);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "screen_size" varchar(30);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "display_type" varchar(60);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "resolution" varchar(30);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "max_resolution" varchar(30);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "refresh_rate" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "ram_memory" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "ssd_size" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "storage" varchar(120);