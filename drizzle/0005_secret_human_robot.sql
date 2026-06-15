ALTER TABLE "kot_ticket" DROP CONSTRAINT "kot_ticket_order_id_outlets_id_fk";
--> statement-breakpoint
ALTER TABLE "kot_ticket" ADD CONSTRAINT "kot_ticket_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;