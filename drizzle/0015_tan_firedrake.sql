ALTER TABLE "order_items" ADD COLUMN "subtotal" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "notes" text;--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");