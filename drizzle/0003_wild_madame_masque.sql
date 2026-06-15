CREATE TYPE "public"."table_shape" AS ENUM('square', 'round');--> statement-breakpoint
CREATE TYPE "public"."table_status" AS ENUM('available', 'occupied', 'reserved', 'dirty');--> statement-breakpoint
CREATE TABLE "dining_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"outlet_id" uuid NOT NULL,
	"table_number" varchar(20) NOT NULL,
	"capacity" integer DEFAULT 4 NOT NULL,
	"shape" "table_shape" DEFAULT 'square' NOT NULL,
	"position_x" numeric(10, 2) DEFAULT '0' NOT NULL,
	"position_y" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" "table_status" DEFAULT 'available' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE cascade ON UPDATE no action;