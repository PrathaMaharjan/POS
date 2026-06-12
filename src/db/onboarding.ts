/**
 * Tenant onboarding service
 * Called after Better Auth creates a user + organization
 * Wires up: tenant row, system roles, 14-day trial subscription
 */

import { eq } from "drizzle-orm";
import { db } from ".";
import { permission, role, rolePermission } from "./schema/rbac";
import { location, tenant } from "./schema/tenancy";
import { subscription } from "./schema/billing";
import { createId } from "@paralleldrive/cuid2";

// ─── System Role Definitions ──────────────────────────────────────────────────
// action:resource pairs for each built-in role
const SYSTEM_ROLE_PERMISSIONS: Record<string, string[]> = {
  Owner: ["manage:*"], // handled specially — gets all permissions
  Manager: [
    "manage:sale",
    "manage:product",
    "manage:category",
    "manage:inventory",
    "update:inventory",
    "create:stock_movement",
    "read:report",
    "manage:customer",
    "manage:cash_drawer",
    "manage:discount",
  ],
  Cashier: [
    "create:sale",
    "read:sale",
    "read:product",
    "read:category",
    "create:payment",
    "read:payment",
    "read:customer",
    "create:customer",
    "manage:cash_drawer",
  ],
  "Inventory Staff": [
    "create:stock_movement",
    "read:inventory_item",
    "update:inventory",
    "read:product",
    "read:category",
    "manage:purchase_order",
    "manage:supplier",
  ],
  Viewer: [], // gets all read:* permissions dynamically
};

export interface CreateTenantInput {
  name: string;
  slug: string;
  ownerUserId: string; // Better Auth user id
}

/**
 * Full tenant bootstrap — runs inside a transaction.
 * Call this from your /register server action after Better Auth creates the org.
 */
export async function bootstrapTenant(input: CreateTenantInput) {
  return db.transaction(async (tx) => {
    // 1. Create tenant row
    const [newTenant] = await tx
      .insert(tenant)
      .values({
        id: createId(),
        name: input.name,
        slug: input.slug,
        status: "ACTIVE",
      })
      .returning();

    // 2. Create 14-day trial subscription
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // await tx.insert(subscription).values({
    //   id: createId(),
    //   tenantId: newTenant.id,
    //   status: "TRIALING",
    //   interval: "MONTHLY",
    //   platformFeePerLocation: 2900,
    //   trialEndsAt,
    // });

    // 3. Seed system roles + permissions for this tenant
    await createSystemRoles(tx, newTenant.id);

    return newTenant;
  });
}

/**
 * Create system roles for a tenant with correct permissions.
 * Idempotent — safe to call multiple times.
 */
async function createSystemRoles(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string,
) {
  // Fetch all permissions from DB
  const allPermissions = await tx.select().from(permission);

  const permissionMap = new Map(
    allPermissions.map((p) => [`${p.action}:${p.resource}`, p.id]),
  );

  // Helper: get permission IDs for a role
  function resolvePermissions(actionResources: string[]): string[] {
    if (actionResources.includes("manage:*")) {
      // Owner gets everything
      return allPermissions.map((p) => p.id);
    }
    return actionResources
      .map((ar) => permissionMap.get(ar))
      .filter(Boolean) as string[];
  }

  // Helper: viewer gets all read:* permissions
  function resolveViewerPermissions(): string[] {
    return allPermissions.filter((p) => p.action === "read").map((p) => p.id);
  }

  for (const [roleName, actionResources] of Object.entries(
    SYSTEM_ROLE_PERMISSIONS,
  )) {
    // Insert role
    const [newRole] = await tx
      .insert(role)
      .values({
        id: createId(),
        tenantId,
        name: roleName,
        isSystem: true,
      })
      .onConflictDoNothing()
      .returning();

    if (!newRole) continue; // already exists

    // Resolve permissions
    const permissionIds =
      roleName === "Viewer"
        ? resolveViewerPermissions()
        : resolvePermissions(actionResources);

    if (permissionIds.length === 0) continue;

    // Insert role permissions
    await tx.insert(rolePermission).values(
      permissionIds.map((permissionId) => ({
        id: createId(),
        roleId: newRole.id,
        permissionId,
      })),
    );
  }
}

/**
 * Add a first location to a tenant (required for billing)
 */
export async function createFirstLocation(input: {
  tenantId: string;
  name: string;
  address?: string;
  phone?: string;
}) {
  const [newLocation] = await db
    .insert(location)
    .values({
      id: createId(),
      tenantId: input.tenantId,
      name: input.name,
      address: input.address,
      phone: input.phone,
      isActive: true,
    })
    .returning();

  return newLocation;
}

/**
 * Get a tenant by slug (used after Better Auth org creation)
 */
export async function getTenantBySlug(slug: string) {
  const [result] = await db
    .select()
    .from(tenant)
    .where(eq(tenant.slug, slug))
    .limit(1);
  return result ?? null;
}
