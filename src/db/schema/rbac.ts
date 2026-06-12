import { pgTable, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";
// import {  tenant, tenantUser } from "./tenancy";
import { location, tenant, tenantUser } from "./tenancy";
import { relations } from "drizzle-orm";

export const module = pgTable("module", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  label: text("label").notNull(), // "Point of Sale"
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});

export const permission = pgTable("permission", {
  id: text("id").primaryKey(),
  moduleId: text("module_id")
    .notNull()
    .references(() => module.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // create | read | update | delete | manage
  resource: text("resource").notNull(), // sale | product | inventory | etc.
  label: text("label"), // human-readable: "Create Sale"
});

export const role = pgTable(
  "role",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "Owner" | "Manager" | "Cashier"
    isSystem: boolean("is_system").notNull().default(false), // system roles cannot be deleted
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("unique_role_per_tenant").on(t.tenantId, t.name)],
);

export const rolePermission = pgTable(
  "role_permission",
  {
    id: text("id").primaryKey(),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
  },
  (t) => [unique("unique_role_permission").on(t.roleId, t.permissionId)],
);

export const userRole = pgTable("user_role", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => tenantUser.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => role.id, { onDelete: "cascade" }),
  locationId: text("location_id").references(() => location.id, {
    onDelete: "cascade",
  }), // null = all locations
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// relation
export const roleRelationx = relations(role, ({ one, many }) => ({
  tenant: one(tenant, { fields: [role.tenantId], references: [tenant.id] }),
  rolePermission: many(rolePermission),
  userRole: many(userRole),
}));
export const rolePermissionRelations = relations(rolePermission, ({ one }) => ({
  role: one(role, { fields: [rolePermission.roleId], references: [role.id] }),
  permission: one(permission, {
    fields: [rolePermission.permissionId],
    references: [permission.id],
  }),
}));

export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(tenantUser, {
    fields: [userRole.userId],
    references: [tenantUser.id],
  }),
  role: one(role, { fields: [userRole.roleId], references: [role.id] }),
  location: one(location, {
    fields: [userRole.locationId],
    references: [location.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type Module = typeof module.$inferSelect;
export type Permission = typeof permission.$inferSelect;
export type Role = typeof role.$inferSelect;
export type NewRole = typeof role.$inferInsert;
export type UserRole = typeof userRole.$inferSelect;
