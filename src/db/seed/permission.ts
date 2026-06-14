import { db } from "..";
import { permissions, rolePermissions, roles } from "../schema";


const MODULES: Record<string, string[]> = {
  pos: ["billing", "payments", "shift_reports"],
  restaurant: ["tables", "kot", "bill_splits"],
  inventory: ["products", "stock", "recipes", "suppliers"],
  core: ["outlets", "users", "roles"],
};

const ACTIONS = ["create", "read", "update", "delete"];

async function seedPermissions() {
  const rows = [];
  for (const [module, resources] of Object.entries(MODULES)) {
    for (const resource of resources) {
      for (const action of ACTIONS) {
        rows.push({ module, resource, action, code: `${module}.${resource}.${action}` });
      }
    }
  }

  const inserted = await db
    .insert(permissions)
    .values(rows)
    .onConflictDoNothing()
    .returning();

  console.log(`Seeded ${inserted.length} permissions`);
}

async function seedSystemRoles() {
  const allPerms = await db.query.permissions.findMany();

  // Superadmin - everything
  const [superadminRole] = await db
    .insert(roles)
    .values({ name: "Superadmin", organizationId: null, isSystem: "true" })
    .returning();

  await db.insert(rolePermissions).values(
    allPerms.map((p) => ({ roleId: superadminRole.id, permissionId: p.id }))
  ).onConflictDoNothing();

  // Admin - everything except core.*.delete
  const [adminRole] = await db
    .insert(roles)
    .values({ name: "Admin", organizationId: null, isSystem: "true" })
    .returning();

  await db.insert(rolePermissions).values(
    allPerms
      .filter((p) => !(p.module === "core" && p.action === "delete"))
      .map((p) => ({ roleId: adminRole.id, permissionId: p.id }))
  ).onConflictDoNothing();

  // Cashier - pos create/read, restaurant read
  const [cashierRole] = await db
    .insert(roles)
    .values({ name: "Cashier", organizationId: null, isSystem: "true" })
    .returning();

  await db.insert(rolePermissions).values(
    allPerms
      .filter(
        (p) =>
          (p.module === "pos" && ["create", "read"].includes(p.action)) ||
          (p.module === "restaurant" && p.action === "read")
      )
      .map((p) => ({ roleId: cashierRole.id, permissionId: p.id }))
  ).onConflictDoNothing();

  console.log("Seeded system roles: Superadmin, Admin, Cashier");
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