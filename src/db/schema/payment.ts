import { numeric, pgEnum, pgTable, uuid,timestamp, index } from "drizzle-orm/pg-core";
import { orders } from "./order";
import { outlets, users } from "./core";
import { relations } from "drizzle-orm";

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "qr"]);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  outletId: uuid("outlet_id")
    .notNull()
    .references(() => outlets.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  receivedBy: uuid("received_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},(t)=>[
  index("payments_order_idx").on(t.orderId),
  index("payments_outlet_idx").on(t.outletId),
]);

// The payments table has foreign key relationships with orders, outlets, and users. Each payment belongs to one order, one outlet,
//  and is received by one user, while an order, outlet, or user can be associated with many payments (one-to-many relationship).
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  outlet: one(outlets, { fields: [payments.outletId], references: [outlets.id] }),
  receivedByUser: one(users, { fields: [payments.receivedBy], references: [users.id] }),
}));