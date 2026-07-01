import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { permissions, roles } from "./rbac";

export const orgStatusEnum = pgEnum("org_status", [
  "active",
  "suspended",
  "trial",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logo: text("logo"), // nullable, stores URL/path to logo image, default null
  imagePublicId: text("image_public_id"),
  isActive: boolean("is_active").notNull().default(true),
  status: orgStatusEnum("status").default("trial").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 30 }),
    passwordHash: text("password_hash").notNull(),
    isOwner: boolean("is_owner").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(), // <-- new
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    index("users_org_active_idx").on(t.organizationId, t.isActive),
    index("users_org_owner_idx").on(t.organizationId, t.isOwner),
  ],
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userid: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenhash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("email_verification_tokens_hash_idx").on(table.tokenhash as any),
    index("email_verification_tokens_user_idx").on(table.userid as any),
  ],
);
export const outlets = pgTable(
  "outlets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    phone: varchar("phone", { length: 30 }),
    skipKitchenWorkflow: boolean("skip_kitchen_workflow")
      .notNull()
      .default(false),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("outlets_org_idx").on(table.organizationId as any),
    uniqueIndex("outlets_org_name_unique").on(
      table.organizationId as any,
      table.name as any,
    ),
  ],
);

export const userOutlets = pgTable(
  "user_outlets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    outletId: uuid("outlet_id")
      .notNull()
      .references(() => outlets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_outlets_user_idx").on(table.userId as any),
    index("user_outlets_outlet_idx").on(table.outletId as any),
  ],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    revoked: boolean("revoked").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("refresh_tokens_user_idx").on(t.userId), // revoke user tokens
    index("refresh_tokens_hash_idx").on(t.tokenHash),
  ],
);
export const superAdmins = pgTable("super_admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orgRolePermissions = pgTable(
  "org_role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // one row per org + role + permission combination
    uniqueIndex("org_role_permissions_unique").on(
      t.organizationId,
      t.roleId,
      t.permissionId,
    ),
    index("org_role_permissions_org_idx").on(t.organizationId),
    index("org_role_permissions_role_idx").on(t.roleId),
  ],
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  outlets: many(outlets),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  userOutlets: many(userOutlets),
  refreshTokens: many(refreshTokens),
}));
// Many users belong to one organization.
// User A ----\
// User B ----- > Abstrakt POS
// User C ----/

export const outletsRelations = relations(outlets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [outlets.organizationId],
    references: [organizations.id],
  }),
  userOutlets: many(userOutlets),
}));

// This is the most important relationship.
// A user can work in multiple outlets.
// An outlet can have multiple users.

export const userOutletsRelations = relations(userOutlets, ({ one }) => ({
  user: one(users, { fields: [userOutlets.userId], references: [users.id] }),
  outlet: one(outlets, {
    fields: [userOutlets.outletId],
    references: [outlets.id],
  }),
}));

export const orgRolePermissionsRelations = relations(
  orgRolePermissions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [orgRolePermissions.organizationId],
      references: [organizations.id],
    }),
    role: one(roles, {
      fields: [orgRolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [orgRolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);
