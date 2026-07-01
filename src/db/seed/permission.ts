import { db } from "../index";
import { permissions, roles, rolePermissions } from "../schema";
import { eq } from "drizzle-orm";

const MODULES: Record<string, string[]> = {
  pos: ["billing", "payments", "shift_reports"],
  restaurant: ["tables", "kot", "bill_splits"],
  // inventory: ["products", "stock", "recipes", "suppliers"],
  inventory: ["categories", "products", "stock", "recipes", "suppliers"],
  core: ["outlets", "users", "roles"],
};

const ACTIONS = ["create", "read", "update", "delete"];

async function seedPermissions() {
  const rows = [];
  for (const [module, resources] of Object.entries(MODULES)) {
    for (const resource of resources) {
      for (const action of ACTIONS) {
        rows.push({
          module,
          resource,
          action,
          code: `${module}.${resource}.${action}`,
        });
      }
    }
  }

  const inserted = await db
    .insert(permissions)
    .values(rows)
    .onConflictDoNothing()
    .returning();

  console.log(
    `Seeded ${inserted.length} new permissions (56 total in catalog)`,
  );
}

// Find an existing system role by name (org-level template, organizationId = null)
async function findRoleByName(name: string) {
  return db.query.roles.findFirst({
    where: (r, { eq, and, isNull }) =>
      and(eq(r.name, name), isNull(r.organizationId)),
  });
}

// Find a role by name, or create it if it doesn't exist
async function findOrCreateRole(name: string) {
  const existing = await findRoleByName(name);
  if (existing) return existing;

  const [created] = await db
    .insert(roles)
    .values({ name, organizationId: null, isSystem: "true" })
    .returning();
  return created;
}

// If a role with `oldName` exists, rename it to `newName` and return it.
// Otherwise, find-or-create a role with `newName`.
async function renameOrCreateRole(oldName: string, newName: string) {
  const existingOld = await findRoleByName(oldName);
  if (existingOld) {
    const [updated] = await db
      .update(roles)
      .set({ name: newName })
      .where(eq(roles.id, existingOld.id))
      .returning();
    return updated;
  }
  return findOrCreateRole(newName);
}

// Replace a role's permission set entirely (idempotent)
async function setRolePermissions(roleId: string, permissionIds: string[]) {
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  if (permissionIds.length === 0) return;
  await db
    .insert(rolePermissions)
    .values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
}

function code(p: { module: string; resource: string; action: string }) {
  return `${p.module}.${p.resource}.${p.action}`;
}

async function seedSystemRoles() {
  const allPerms = await db.query.permissions.findMany();
  const byCode = new Map(allPerms.map((p) => [code(p), p.id]));

  const pick = (codes: string[]) =>
    codes.map((c) => byCode.get(c)).filter((id): id is string => Boolean(id));

  // --- 1. Owner (renamed from "Superadmin"): everything ---
  const owner = await renameOrCreateRole("Superadmin", "Owner");
  await setRolePermissions(
    owner.id,
    allPerms.map((p) => p.id),
  );

  // --- 2. Manager (renamed from "Admin"): everything except core.*.delete ---
  const manager = await renameOrCreateRole("Admin", "Manager");
  await setRolePermissions(
    manager.id,
    allPerms
      .filter((p) => {
        // Block core.outlets.delete and core.roles.delete, but allow core.users.delete
        if (
          p.module === "core" &&
          p.action === "delete" &&
          p.resource !== "users"
        ) {
          return false;
        }
        return true;
      })
      .map((p) => p.id),
  );

  // --- 3. Cashier: POS checkout, payments, shift drawer, order history, menu read ---
  const cashier = await findOrCreateRole("Cashier");
  await setRolePermissions(
    cashier.id,
    pick([
      "inventory.products.read",
      "pos.billing.create",
      "pos.billing.read",
      "pos.billing.update",
      "pos.payments.create",
      "pos.payments.read",
      "pos.shift_reports.create",
      "pos.shift_reports.read",
      "pos.shift_reports.update",
      "restaurant.tables.read",
      "restaurant.tables.update",
      "restaurant.kot.read",
      "restaurant.kot.update",
      "restaurant.bill_splits.create",
      "restaurant.bill_splits.read",
    ]),
  );

  // --- 4. Waiter: table selection, tableside ordering, KOT creation ---
  const waiter = await findOrCreateRole("Waiter");
  await setRolePermissions(
    waiter.id,
    pick([
      "inventory.products.read",
      "restaurant.tables.read",
      "restaurant.tables.update",
      "restaurant.kot.create",
      "restaurant.kot.read",
      "restaurant.kot.update",
      "pos.billing.create",
      "pos.billing.read",
      "pos.payments.create",
      "pos.payments.read",
      "pos.billing.update",
    ]),
  );

  // --- 5. Kitchen Crew: KDS board, KOT state transitions only ---
  const kitchenCrew = await findOrCreateRole("Kitchen Crew");
  await setRolePermissions(
    kitchenCrew.id,
    pick([
      "restaurant.kot.read",
      "restaurant.kot.update",
      "inventory.stock.read",
      "inventory.stock.update",
    ]),
  );
  const allRounder = await findOrCreateRole("All Rounder");

  console.log(
    "Seeded system roles: Owner, Manager, Cashier, Waiter, Kitchen Crew",
  );
}

async function main() {
  await seedPermissions();
  await seedSystemRoles();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
