import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
// import { createId } from "@paralleldrive/cuid2";
import { tenant } from "./tenancy";
import { module } from "./rbac";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "PAUSED",
]);

export const billingIntervalEnum = pgEnum("billing_interval", [
  "MONTHLY",
  "YEARLY",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "OPEN",
  "PAID",
  "VOID",
  "UNCOLLECTIBLE",
]);

// ─── Subscription ─────────────────────────────────────────────────────────────
// One subscription per tenant
export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .unique()
    .references(() => tenant.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: subscriptionStatusEnum("status").notNull().default("TRIALING"),
  interval: billingIntervalEnum("interval").notNull().default("MONTHLY"),
  platformFeePerLocation: integer("platform_fee_per_location")
    .notNull()
    .default(2900), // $29.00 in cents
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodStart: timestamp("current_period_start", {
    withTimezone: true,
  }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Module Price ─────────────────────────────────────────────────────────────
// Per-module per-location pricing
export const modulePrice = pgTable("module_price", {
  id: text("id").primaryKey(),
  moduleId: text("module_id")
    .notNull()
    .references(() => module.id, { onDelete: "cascade" }),
  pricePerLocationMonthly: integer("price_per_location_monthly").notNull(), // cents
  pricePerLocationYearly: integer("price_per_location_yearly").notNull(), // cents
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdYearly: text("stripe_price_id_yearly"),
});

// ─── Subscription Module ──────────────────────────────────────────────────────
// Which modules has this tenant enabled?
export const subscriptionModule = pgTable(
  "subscription_module",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscription.id, { onDelete: "cascade" }),
    moduleId: text("module_id")
      .notNull()
      .references(() => module.id, { onDelete: "cascade" }),
    stripeSubscriptionItemId: text("stripe_subscription_item_id"),
    enabledAt: timestamp("enabled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("unique_subscription_module").on(t.subscriptionId, t.moduleId),
  ],
);

// ─── Invoice ──────────────────────────────────────────────────────────────────
export const invoice = pgTable("invoice", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenant.id, { onDelete: "cascade" }),
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  status: invoiceStatusEnum("status").notNull().default("DRAFT"),
  amountDue: integer("amount_due").notNull(), // cents
  amountPaid: integer("amount_paid").notNull().default(0),
  currency: text("currency").notNull().default("usd"),
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Invoice Line ─────────────────────────────────────────────────────────────
export const invoiceLine = pgTable("invoice_line", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoice.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitAmount: integer("unit_amount").notNull(), // cents
  totalAmount: integer("total_amount").notNull(), // cents
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const subscriptionRelations = relations(
  subscription,
  ({ one, many }) => ({
    tenant: one(tenant, {
      fields: [subscription.tenantId],
      references: [tenant.id],
    }),
    subscriptionModules: many(subscriptionModule),
    invoices: many(invoice),
  }),
);

export const invoiceRelations = relations(invoice, ({ one, many }) => ({
  tenant: one(tenant, { fields: [invoice.tenantId], references: [tenant.id] }),
  lines: many(invoiceLine),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
export type Invoice = typeof invoice.$inferSelect;
