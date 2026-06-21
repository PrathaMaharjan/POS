CREATE INDEX "products_outlet_idx" ON "products" USING btree ("outlet_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_outlet_name_unique" ON "products" USING btree ("outlet_id","name");