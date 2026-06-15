import { pgEnum, pgTable, uuid,timestamp } from "drizzle-orm/pg-core";
import { orderItems, orders } from "./order";
import { outlets } from "./core";
import { relations } from "drizzle-orm";

export const kotStatusEnum = pgEnum("kot_status", [
  "pending",
  "preparing",
  "ready",
]);

// export const kotTickets = pgTable("kot_tickets", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   orderId: uuid("order_id")
//     .notNull()
//     .references(() => orders.id, { onDelete: "cascade" }),
//   outletId: uuid("outlet_id")
//     .notNull()
//     .references(() => outlets.id, { onDelete: "cascade" }),
//   status: kotStatusEnum("status").default("pending").notNull(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });
export const kotTickets = pgTable("kot_ticket", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  outletId: uuid("outlet_id")
    .notNull()
    .references(() => outlets.id, { onDelete: "cascade" }),
  status: kotStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
/*
kot_items just lists "which order items belong to this kitchen ticket" — it's the link between a KOT ticket and the specific items (e.g. 2x Momo, 1x Coffee) the kitchen needs to prepare for it.
It exists separately so that if more items get added later, they can become a new ticket instead of being mixed into the old one.
*/
export const kotItems = pgTable("kot_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  kotTicketId: uuid("kot_ticket_id")
    .notNull()
    .references(() => kotTickets.id, { onDelete: "cascade" }),
  orderItemId: uuid("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
});

export const kotTicketsRelations = relations(kotTickets, ({ one, many }) => ({
  order: one(orders, { fields: [kotTickets.orderId], references: [orders.id] }),
  outlet: one(outlets, {
    fields: [kotTickets.outletId],
    references: [outlets.id],
  }),
  items: many(kotItems),
}));

export const kotItemsRelations = relations(kotItems, ({ one }) => ({
  kotTicket: one(kotTickets, {
    fields: [kotItems.kotTicketId],
    references: [kotTickets.id],
  }),
  orderItem: one(orderItems, {
    fields: [kotItems.orderItemId],
    references: [orderItems.id],
  }),
}));
