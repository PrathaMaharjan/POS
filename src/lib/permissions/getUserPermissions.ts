import { db } from "@/db";
import { permissions, rolePermissions, userOutletRoles } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// export async function getUserPermissionsForOutlet(
//   userId: string,
//   outletId: string
// ): Promise<string[]> {
//   const result = await db
//     .select({ code: permissions.code })
//     .from(userOutletRoles)
//     .innerJoin(rolePermissions, eq(rolePermissions.roleId, userOutletRoles.roleId))
//     .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
//     .where(
//       and(
//         eq(userOutletRoles.userId, userId),
//         eq(userOutletRoles.outletId, outletId)
//       )
//     );

//   return result.map((r) => r.code);
// }

// export async function getUserRoleForOutlet(userId: string, outletId: string) {
//   const result = await db.query.userOutletRoles.findFirst({
//     where: (uor, { eq, and }) => and(eq(uor.userId, userId), eq(uor.outletId, outletId)),
//     with: { role: true },
//   });

//   return result?.role ?? null; // { id, name, organizationId, isSystem } or null
// }


// export async function getUserPermissionsForOutlet(
//   userId:         string,
//   outletId:       string,
//   organizationId: string
// ): Promise<string[]> {

//   const userRole = await db.query.userOutletRoles.findFirst({
//     where: (uor, { eq, and }) =>
//       and(eq(uor.userId, userId), eq(uor.outletId, outletId)),
//     columns: { roleId: true },
//   });

//   if (!userRole) return [];
//   const { roleId } = userRole;

//   // ── 1. get global permissions as the base ──
//   const globalPerms = await db.query.rolePermissions.findMany({
//     where: (rp, { eq }) => eq(rp.roleId, roleId),
//     with: { permission: { columns: { id: true, code: true } } },
//   });

//   // build a map: permissionId → code, starting with global enabled = true
//   const permissionMap = new Map<string, { code: string; enabled: boolean }>();
//   for (const gp of globalPerms) {
//     permissionMap.set(gp.permission.id, {
//       code:    gp.permission.code,
//       enabled: true, // global presence = enabled by default
//     });
//   }

//   // ── 2. apply org overrides on top ──
//   const orgOverrides = await db.query.orgRolePermissions.findMany({
//     where: (orp, { eq, and }) =>
//       and(eq(orp.organizationId, organizationId), eq(orp.roleId, roleId)),
//     with: { permission: { columns: { id: true, code: true } } },
//   });

//   for (const override of orgOverrides) {
//     permissionMap.set(override.permission.id, {
//       code:    override.permission.code,
//       enabled: override.isEnabled, // override wins
//     });
//   }

//   // ── 3. return only enabled permission codes ──
//   return Array.from(permissionMap.values())
//     .filter((p) => p.enabled)
//     .map((p) => p.code);
// }

export async function getUserPermissionsForOutlet(
  userId:         string,
  outletId:       string,
  organizationId: string
): Promise<string[]> {

  // ── 1. get user's role ──
  const userRole = await db.query.userOutletRoles.findFirst({
    where: (uor, { eq, and }) =>
      and(eq(uor.userId, userId), eq(uor.outletId, outletId)),
    columns: { roleId: true },
  });

  if (!userRole) return [];
  const { roleId } = userRole;

  // ── 2. fetch outlet-specific + org-level overrides + global in parallel ──
  const [outletOverrides, orgOverrides, globalPerms] = await Promise.all([

    // outlet-specific overrides (highest priority)
    db.query.orgRolePermissions.findMany({
      where: (orp, { eq, and }) =>
        and(
          eq(orp.organizationId, organizationId),
          eq(orp.outletId,       outletId),  // ← specific outlet
          eq(orp.roleId,         roleId)
        ),
      with: { permission: { columns: { id: true, code: true } } },
    }),

    // org-level overrides (fallback)
    db.query.orgRolePermissions.findMany({
      where: (orp, { eq, and, isNull }) =>
        and(
          eq(orp.organizationId, organizationId),
          isNull(orp.outletId),  // ← org-level (no outlet)
          eq(orp.roleId,         roleId)
        ),
      with: { permission: { columns: { id: true, code: true } } },
    }),

    // global defaults (lowest priority)
    db.query.rolePermissions.findMany({
      where: (rp, { eq }) => eq(rp.roleId, roleId),
      with: { permission: { columns: { id: true, code: true } } },
    }),
  ]);

  // ── 3. build permission map — outlet overrides win over org overrides win over global ──
  const permissionMap = new Map<string, { code: string; enabled: boolean }>();

  // start with global (lowest priority)
  for (const gp of globalPerms) {
    permissionMap.set(gp.permission.id, {
      code:    gp.permission.code,
      enabled: true,
    });
  }

  // apply org-level overrides
  for (const op of orgOverrides) {
    permissionMap.set(op.permission.id, {
      code:    op.permission.code,
      enabled: op.isEnabled,
    });
  }

  // apply outlet-specific overrides (highest priority — wins everything)
  for (const op of outletOverrides) {
    permissionMap.set(op.permission.id, {
      code:    op.permission.code,
      enabled: op.isEnabled,
    });
  }

  // ── 4. return only enabled permissions ──
  return Array.from(permissionMap.values())
    .filter((p) => p.enabled)
    .map((p) => p.code);
}


export async function getUserRoleForOutlet(
  userId:   string,
  outletId: string
) {
  const userRole = await db.query.userOutletRoles.findFirst({
    where: (uor, { eq, and }) =>
      and(
        eq(uor.userId,   userId),
        eq(uor.outletId, outletId)
      ),
    with: {
      role: {
        columns: { id: true, name: true },
      },
    },
  });

  return userRole?.role ?? null;
}
