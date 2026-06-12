import { pgTable, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const tenantStatusEnum = pgEnum("tenant_status", [
  "ACTIVE",
  "SUSPENDED",
  "DELETED",
]);

export const platformRoleEnum = pgEnum("platform_role", [
  "support",
  "admin",
  "billing",
]);

export const tenant = pgTable("tenant", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // fixed: was text("text")
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  status: tenantStatusEnum("status").notNull().default("ACTIVE"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const location = pgTable("location", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenant.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(), // fixed: was "created_at"
});

export const tenantUser = pgTable("tenant_user", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenant.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const platfrom_User = pgTable("platfrom_user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: platformRoleEnum("role").notNull().default("support"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tenantRelations = relations(tenant, ({ many }) => ({
  locations: many(location),
  tenantUsers: many(tenantUser),
}));

export const locationRelations = relations(location, ({ one }) => ({
  tenant: one(tenant, { fields: [location.tenantId], references: [tenant.id] }),
}));

export const tenantUserRelations = relations(tenantUser, ({ one }) => ({
  tenant: one(tenant, {
    fields: [tenantUser.tenantId],
    references: [tenant.id],
  }),
}));

export type Tenant = typeof tenant.$inferSelect;
export type NewTenant = typeof tenant.$inferInsert;
export type Location = typeof location.$inferSelect;
export type NewLocation = typeof location.$inferInsert;
export type TenantUser = typeof tenantUser.$inferSelect;
export type NewTenantUser = typeof tenantUser.$inferInsert;
export type PlatformUser = typeof platfrom_User.$inferSelect;
