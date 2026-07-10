import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { outlets } from ".";
import { recipes } from "./stock"; // ← import from stock for relation

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    outletId: uuid("outlet_id")
      .notNull()
      .references(() => outlets.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("categories_outlet_idx").on(t.outletId as any),
    uniqueIndex("categories_outlet_name_unique").on(
      t.outletId as any,
      t.name as any,
    ),
  ],
);

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    outletId: uuid("outlet_id")
      .notNull()
      .references(() => outlets.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }),
    hasVariants: boolean("has_variants").default(false).notNull(),

    imagePublicId: text("image_public_id"),
    isAvailable: boolean("is_available").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("products_outlet_available_idx").on(t.outletId, t.isAvailable),
    index("products_outlet_category_idx").on(t.outletId, t.categoryId),
    index("products_outlet_active_idx").on(t.outletId, t.isActive),
    uniqueIndex("products_outlet_name_unique").on(t.outletId, t.name),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    label: varchar("label", { length: 50 }).notNull(),
    // e.g. "30ml", "50ml", "Half Plate", "Full Plate", "Small", "Large"

    price: numeric("price", { precision: 10, scale: 2 }).notNull(),

    isDefault: boolean("is_default").notNull().default(false),
    // which variant is pre-selected/shown first in the UI

    sortOrder: integer("sort_order").notNull().default(0),
    // controls display order: 30ml before 50ml, Small before Large

    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("product_variants_product_idx").on(t.productId),
    uniqueIndex("product_variants_product_label_unique").on(
      t.productId,
      t.label,
    ),
  ],
);

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  outlet: one(outlets, {
    fields: [categories.outletId],
    references: [outlets.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  outlet: one(outlets, {
    fields: [products.outletId],
    references: [outlets.id],
  }),
   variants: many(productVariants),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  recipes: many(recipes), // ← links to stock.ts
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));