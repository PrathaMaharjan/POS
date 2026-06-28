import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { outlets, orders, users, products } from ".";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────
export const stockUnitEnum = pgEnum("stock_unit", [
  "g", "kg", "ml", "L", "pieces",
]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "purchase",
  "deduction",
  "wastage",
  "adjustment",
]);

// ─────────────────────────────────────────────
// STOCK ITEMS
// ─────────────────────────────────────────────
export const stockItems = pgTable(
  "stock_items",
  {
    id:            uuid("id").defaultRandom().primaryKey(),
    outletId:      uuid("outlet_id")
                     .notNull()
                     .references(() => outlets.id, { onDelete: "cascade" }),
    name:          varchar("name", { length: 255 }).notNull(),
    unit:          stockUnitEnum("unit").notNull(),
    currentStock:  numeric("current_stock", { precision: 10, scale: 3 })
                     .notNull()
                     .default("0"),
    minStockLevel: numeric("min_stock_level", { precision: 10, scale: 3 })
                     .notNull()
                     .default("0"),
    isActive:      boolean("is_active").notNull().default(true),
    createdAt:     timestamp("created_at").defaultNow().notNull(),
    updatedAt:     timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("si_outlet_idx").on(t.outletId),
    uniqueIndex("si_outlet_name_unique").on(t.outletId, t.name),
  ]
);

// ─────────────────────────────────────────────
// RECIPES
// ─────────────────────────────────────────────
export const recipes = pgTable(
  "recipes",
  {
    id:        uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
                 .notNull()
                 .references(() => products.id, { onDelete: "cascade" }),
    outletId:  uuid("outlet_id")
                 .notNull()
                 .references(() => outlets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("rec_product_outlet_unique").on(t.productId, t.outletId),
    index("rec_outlet_idx").on(t.outletId),
  ]
);

// ─────────────────────────────────────────────
// RECIPE ITEMS
// ─────────────────────────────────────────────
export const recipeItems = pgTable(
  "recipe_items",
  {
    id:          uuid("id").defaultRandom().primaryKey(),
    recipeId:    uuid("recipe_id")
                   .notNull()
                   .references(() => recipes.id, { onDelete: "cascade" }),
    stockItemId: uuid("stock_item_id")
                   .notNull()
                   .references(() => stockItems.id, { onDelete: "cascade" }),
    quantity:    numeric("quantity", { precision: 10, scale: 3 }).notNull(),
    createdAt:   timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("ri_recipe_stock_unique").on(t.recipeId, t.stockItemId),
    index("ri_recipe_idx").on(t.recipeId),
  ]
);

// ─────────────────────────────────────────────
// STOCK MOVEMENTS
// ─────────────────────────────────────────────
export const stockMovements = pgTable(
  "stock_movements",
  {
    id:          uuid("id").defaultRandom().primaryKey(),
    outletId:    uuid("outlet_id")
                   .notNull()
                   .references(() => outlets.id, { onDelete: "cascade" }),
    stockItemId: uuid("stock_item_id")
                   .notNull()
                   .references(() => stockItems.id, { onDelete: "cascade" }),
    type:        stockMovementTypeEnum("type").notNull(),
    quantity:    numeric("quantity", { precision: 10, scale: 3 }).notNull(),
    note:        text("note"),
    orderId:     uuid("order_id")
                   .references(() => orders.id, { onDelete: "set null" }),
    createdBy:   uuid("created_by")
                   .references(() => users.id, { onDelete: "set null" }),
    createdAt:   timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("sm_outlet_idx").on(t.outletId),
    index("sm_stock_item_idx").on(t.stockItemId),
    index("sm_order_idx").on(t.orderId),
    index("sm_created_at_idx").on(t.createdAt),
  ]
);

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────
export const stockItemsRelations = relations(stockItems, ({ one, many }) => ({
  outlet:         one(outlets, {
    fields:     [stockItems.outletId],
    references: [outlets.id],
  }),
  recipeItems:    many(recipeItems),
  stockMovements: many(stockMovements),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  product: one(products, {
    fields:     [recipes.productId],
    references: [products.id],
  }),
  outlet: one(outlets, {
    fields:     [recipes.outletId],
    references: [outlets.id],
  }),
  recipeItems: many(recipeItems),
}));

export const recipeItemsRelations = relations(recipeItems, ({ one }) => ({
  recipe: one(recipes, {
    fields:     [recipeItems.recipeId],
    references: [recipes.id],
  }),
  stockItem: one(stockItems, {
    fields:     [recipeItems.stockItemId],
    references: [stockItems.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  outlet: one(outlets, {
    fields:     [stockMovements.outletId],
    references: [outlets.id],
  }),
  stockItem: one(stockItems, {
    fields:     [stockMovements.stockItemId],
    references: [stockItems.id],
  }),
  order: one(orders, {
    fields:     [stockMovements.orderId],
    references: [orders.id],
  }),
  createdBy: one(users, {
    fields:     [stockMovements.createdBy],
    references: [users.id],
  }),
}));