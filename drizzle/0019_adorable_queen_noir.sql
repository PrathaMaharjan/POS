DROP INDEX "recipe_items_recipe_stock_unique";--> statement-breakpoint
DROP INDEX "recipe_items_recipe_idx";--> statement-breakpoint
DROP INDEX "recipes_product_outlet_unique";--> statement-breakpoint
DROP INDEX "recipes_outlet_idx";--> statement-breakpoint
DROP INDEX "stock_items_outlet_idx";--> statement-breakpoint
DROP INDEX "stock_items_outlet_name_unique";--> statement-breakpoint
DROP INDEX "stock_movements_outlet_idx";--> statement-breakpoint
DROP INDEX "stock_movements_stock_item_idx";--> statement-breakpoint
DROP INDEX "stock_movements_order_idx";--> statement-breakpoint
DROP INDEX "stock_movements_created_at_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "ri_recipe_stock_unique" ON "recipe_items" USING btree ("recipe_id","stock_item_id");--> statement-breakpoint
CREATE INDEX "ri_recipe_idx" ON "recipe_items" USING btree ("recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rec_product_outlet_unique" ON "recipes" USING btree ("product_id","outlet_id");--> statement-breakpoint
CREATE INDEX "rec_outlet_idx" ON "recipes" USING btree ("outlet_id");--> statement-breakpoint
CREATE INDEX "si_outlet_idx" ON "stock_items" USING btree ("outlet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "si_outlet_name_unique" ON "stock_items" USING btree ("outlet_id","name");--> statement-breakpoint
CREATE INDEX "sm_outlet_idx" ON "stock_movements" USING btree ("outlet_id");--> statement-breakpoint
CREATE INDEX "sm_stock_item_idx" ON "stock_movements" USING btree ("stock_item_id");--> statement-breakpoint
CREATE INDEX "sm_order_idx" ON "stock_movements" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "sm_created_at_idx" ON "stock_movements" USING btree ("created_at");