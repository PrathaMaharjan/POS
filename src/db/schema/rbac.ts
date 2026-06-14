import { pgTable, uuid, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations, users, outlets } from "./core";

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    module: varchar("module", { length: 50 }).notNull(),
    resource: varchar("resource", { length: 50 }).notNull(),
    action: varchar("action", { length: 20 }).notNull(),
    code: varchar("code", { length: 150 }).notNull().unique(),
  },
  (t) => ({
    uq: unique().on(t.module, t.resource, t.action),
  })
);

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  name: varchar("name", { length: 100 }).notNull(),
  isSystem: varchar("is_system", { length: 10 }).default("false").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => ({
    uq: unique().on(t.roleId, t.permissionId),
  })
);

export const userOutletRoles = pgTable(
  "user_outlet_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    outletId: uuid("outlet_id")
      .notNull()
      .references(() => outlets.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (t) => ({
    uq: unique().on(t.userId, t.outletId),
  })
);

export const rolesRelations = relations(roles, ({ many, one }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userOutletRolesRelations = relations(userOutletRoles, ({ one }) => ({
  user: one(users, { fields: [userOutletRoles.userId], references: [users.id] }),
  outlet: one(outlets, {
    fields: [userOutletRoles.outletId],
    references: [outlets.id],
  }),
  role: one(roles, { fields: [userOutletRoles.roleId], references: [roles.id] }),
}));