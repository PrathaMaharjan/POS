CREATE TYPE "public"."kot_status" AS ENUM('pending', 'preparing', 'ready');--> statement-breakpoint
CREATE TABLE "kot_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kot_ticket_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kot_ticket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"outlet_id" uuid NOT NULL,
	"status" "kot_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kot_items" ADD CONSTRAINT "kot_items_kot_ticket_id_kot_ticket_id_fk" FOREIGN KEY ("kot_ticket_id") REFERENCES "public"."kot_ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kot_items" ADD CONSTRAINT "kot_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kot_ticket" ADD CONSTRAINT "kot_ticket_order_id_outlets_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."outlets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kot_ticket" ADD CONSTRAINT "kot_ticket_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE cascade ON UPDATE no action;