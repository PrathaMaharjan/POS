import {
  pgTable,
  uuid,
  varchar,
  numeric,
  integer,
  text,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { diningTables, outlets, users } from ".";
import { products } from "./inventory";
import { payments } from "./payment";

export const orderTypeEnum = pgEnum("order_type", ["dine_in", "takeaway"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    outletId: uuid("outlet_id")
      .notNull()
      .references(() => outlets.id, { onDelete: "cascade" }),
    orderType: orderTypeEnum("order_type").notNull(),
    tableId: uuid("table_id"), // nullable - FK added later when dining_tables exists
    customerName: varchar("customer_name", { length: 150 }),
    customerPhone: varchar("customer_phone", { length: 30 }),
    orderNumber: integer("order_number").notNull(),
    status: orderStatusEnum("status").default("pending").notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("orders_outlet_status_idx").on(t.outletId, t.status), // listOrder, dashboard
    index("orders_table_status_idx").on(t.tableId, t.status), // getOrderByTable
    index("orders_outlet_created_idx").on(t.outletId, t.createdAt), // reports, sales trend
    index("orders_outlet_type_idx").on(t.outletId, t.orderType), // takeaway vs dine-in filter
    uniqueIndex("orders_outlet_number_idx").on(t.outletId, t.orderNumber),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }), // ← changed
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_product_idx").on(t.productId),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  outlet: one(outlets, { fields: [orders.outletId], references: [outlets.id] }),
  table: one(diningTables, {
    fields: [orders.tableId],
    references: [diningTables.id],
  }),
  createdByUser: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
