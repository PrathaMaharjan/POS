import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { outlets } from "./core";

export const tableShapeEnum = pgEnum("table_shape", ["square", "round"]);
export const tableStatusEnum = pgEnum("table_status", [
  "available",
  "occupied",
  "reserved",
  "dirty",
]);

export const diningTables = pgTable("dining_tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id")
    .notNull()
    .references(() => outlets.id, { onDelete: "cascade" }),
  tableNumber: varchar("table_number", { length: 20 }).notNull(),
  capacity: integer("capacity").default(4).notNull(),
  shape: tableShapeEnum("shape").default("square").notNull(),
  positionX: numeric("position_x", { precision: 10, scale: 2 }).default("0").notNull(),
  positionY: numeric("position_y", { precision: 10, scale: 2 }).default("0").notNull(),
  status: tableStatusEnum("status").default("available").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const diningTablesRelations = relations(diningTables, ({ one }) => ({
  outlet: one(outlets, { fields: [diningTables.outletId], references: [outlets.id] }),
}));