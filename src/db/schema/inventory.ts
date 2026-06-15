import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { outlets } from ".";
import { relations } from "drizzle-orm";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id")
    .notNull()
    .references(() => outlets.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id")
    .notNull()
    .references(() => outlets.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const categoriesRelations = relations(categories, ({ one, many }) => ({
  outlet: one(outlets, { fields: [categories.outletId], references: [outlets.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  outlet: one(outlets, { fields: [products.outletId], references: [outlets.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));
