import { db } from "@/db";
import {
  orgRolePermissions,
  rolePermissions,
  permissions,
  roles,
} from "@/db/schema";
import { and, eq, isNotNull, isNull } from "drizzle-orm";

export type ControllerResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string; status: number };

const PROTECTED_ROLES       = ["Owner"];
const PROTECTED_PERMISSIONS = ["core.outlets.delete", "core.roles.delete"];

// ─────────────────────────────────────────────
// GET ROLE PERMISSIONS
// ─────────────────────────────────────────────
export async function getRolePermissions(
  organizationId: string,
  roleId:         string,
  outletId?:      string
) {
  // ── verify role ──
  const role = await db.query.roles.findFirst({
    where: (r, { eq }) => eq(r.id, roleId),
    columns: { id: true, name: true },
  });

  if (!role) {
    return { success: false, error: "Role not found", status: 404 };
  }
  if (PROTECTED_ROLES.includes(role.name)) {
    return { success: false, error: "Cannot modify Owner role", status: 403 };
  }

  // ── get all permissions ──
  const allPermissions = await db.query.permissions.findMany({
    columns: {
      id:       true,
      code:     true,
      module:   true,
      resource: true,
      action:   true,
    },
    orderBy: (p, { asc }) => [asc(p.module), asc(p.resource), asc(p.action)],
  });

  // ── get global + org-level + outlet-level IN PARALLEL ──
  const [globalPerms, orgOverrides, outletOverrides] = await Promise.all([

    // 1. global defaults
    db.query.rolePermissions.findMany({
      where: (rp, { eq }) => eq(rp.roleId, roleId),
      columns: { permissionId: true },
    }),

    // 2. org-level overrides (outletId IS NULL)
    // ✅ direct style — fixes isNull broken SQL bug
    db.query.orgRolePermissions.findMany({
      where: and(
        eq(orgRolePermissions.organizationId, organizationId),
        isNull(orgRolePermissions.outletId),
        eq(orgRolePermissions.roleId,         roleId)
      ),
      columns: { permissionId: true, isEnabled: true },
    }),

    // 3. outlet-specific overrides
    outletId
      ? db.query.orgRolePermissions.findMany({
          where: and(
            eq(orgRolePermissions.organizationId, organizationId),
            eq(orgRolePermissions.outletId,       outletId),
            eq(orgRolePermissions.roleId,         roleId)
          ),
          columns: { permissionId: true, isEnabled: true },
        })
      : Promise.resolve([]),
  ]);

  const globalPermIds     = new Set(globalPerms.map((rp) => rp.permissionId));
  const orgOverrideMap    = new Map(orgOverrides.map((o) => [o.permissionId, o.isEnabled]));
  const outletOverrideMap = new Map(outletOverrides.map((o) => [o.permissionId, o.isEnabled]));

  // ── build result — outlet > org > global ──
  const result = allPermissions.map((perm) => {
    let isEnabled    = globalPermIds.has(perm.id);
    let isOverridden = false;
    let level        = "global";

    if (orgOverrideMap.has(perm.id)) {
      isEnabled    = orgOverrideMap.get(perm.id)!;
      isOverridden = true;
      level        = "organization";
    }

    if (outletOverrideMap.has(perm.id)) {
      isEnabled    = outletOverrideMap.get(perm.id)!;
      isOverridden = true;
      level        = "outlet";
    }

    return {
      ...perm,
      isEnabled,
      isOverridden,
      isProtected: PROTECTED_PERMISSIONS.includes(perm.code),
      level,
    };
  });

  // ── group by module ──
  const grouped = result.reduce<Record<string, typeof result>>((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  return { success: true, data: { role, permissions: grouped } };
}

// ─────────────────────────────────────────────
// TOGGLE PERMISSION
// ─────────────────────────────────────────────
// export async function togglePermission(
//   organizationId: string,
//   roleId:         string,
//   permissionId:   string,
//   isEnabled:      boolean,
//   outletId?:      string
// ): Promise<ControllerResult<{ isEnabled: boolean; level: string }>> {

//   // ── verify role + permission IN PARALLEL ──
//   const [role, permission] = await Promise.all([
//     db.query.roles.findFirst({
//       where: (r, { eq }) => eq(r.id, roleId),
//       columns: { name: true },
//     }),
//     db.query.permissions.findFirst({
//       where: (p, { eq }) => eq(p.id, permissionId),
//       columns: { code: true },
//     }),
//   ]);

//   if (!role) {
//     return { success: false, error: "Role not found", status: 404 };
//   }
//   if (PROTECTED_ROLES.includes(role.name)) {
//     return { success: false, error: "Cannot modify Owner role", status: 403 };
//   }
//   if (!permission) {
//     return { success: false, error: "Permission not found", status: 404 };
//   }
//   if (PROTECTED_PERMISSIONS.includes(permission.code)) {
//     return {
//       success: false,
//       error:  `Permission "${permission.code}" cannot be modified`,
//       status: 403,
//     };
//   }

//   try {
//     if (!outletId) {
//       // ── org-level upsert ──
//       await db
//         .insert(orgRolePermissions)
//         .values({
//           organizationId,
//           outletId:    null,
//           roleId,
//           permissionId,
//           isEnabled,
//         })
//         .onConflictDoUpdate({
//           target:      [
//             orgRolePermissions.organizationId,
//             orgRolePermissions.roleId,
//             orgRolePermissions.permissionId,
//           ],
//           targetWhere: isNull(orgRolePermissions.outletId), // ← partial index match
//           set: { isEnabled, updatedAt: new Date() },
//         });
//     } else {
//       // ── outlet-level upsert ──
//       await db
//         .insert(orgRolePermissions)
//         .values({
//           organizationId,
//           outletId,
//           roleId,
//           permissionId,
//           isEnabled,
//         })
//         .onConflictDoUpdate({
//           target: [
//             orgRolePermissions.organizationId,
//             orgRolePermissions.outletId,
//             orgRolePermissions.roleId,
//             orgRolePermissions.permissionId,
//           ],
//           set: { isEnabled, updatedAt: new Date() },
//         });
//     }

//     return {
//       success: true,
//       data: {
//         isEnabled,
//         level: outletId ? "outlet" : "organization",
//       },
//     };
//   } catch (error) {
//     console.error("togglePermission error:", error);
//     return {
//       success: false,
//       error:  "Failed to update permission",
//       status: 500,
//     };
//   }
// }


export async function togglePermission(
  organizationId: string,
  roleId:         string,
  permissionId:   string,
  isEnabled:      boolean,
  outletId?:      string
): Promise<ControllerResult<{ isEnabled: boolean; level: string }>> {

  // ── verify role + permission IN PARALLEL ──
  const [role, permission] = await Promise.all([
    db.query.roles.findFirst({
      where: (r, { eq }) => eq(r.id, roleId),
      columns: { name: true },
    }),
    db.query.permissions.findFirst({
      where: (p, { eq }) => eq(p.id, permissionId),
      columns: { code: true },
    }),
  ]);

  if (!role) {
    return { success: false, error: "Role not found", status: 404 };
  }
  if (PROTECTED_ROLES.includes(role.name)) {
    return { success: false, error: "Cannot modify Owner role", status: 403 };
  }
  if (!permission) {
    return { success: false, error: "Permission not found", status: 404 };
  }
  if (PROTECTED_PERMISSIONS.includes(permission.code)) {
    return {
      success: false,
      error:  `Permission "${permission.code}" cannot be modified`,
      status: 403,
    };
  }

  try {
    if (!outletId) {
      // ── org-level upsert ──
      await db
        .insert(orgRolePermissions)
        .values({
          organizationId,
          outletId:    null,
          roleId,
          permissionId,
          isEnabled,
        })
        .onConflictDoUpdate({
          target: [
            orgRolePermissions.organizationId,
            orgRolePermissions.roleId,
            orgRolePermissions.permissionId,
          ],
          targetWhere: isNull(orgRolePermissions.outletId), // ← matches org_role_permissions_org_unique
          set: { isEnabled, updatedAt: new Date() },
        });
    } else {
      // ── outlet-level upsert ──
      await db
        .insert(orgRolePermissions)
        .values({
          organizationId,
          outletId,
          roleId,
          permissionId,
          isEnabled,
        })
        .onConflictDoUpdate({
          target: [
            orgRolePermissions.organizationId,
            orgRolePermissions.outletId,
            orgRolePermissions.roleId,
            orgRolePermissions.permissionId,
          ],
          targetWhere: isNotNull(orgRolePermissions.outletId), // ← ADDED — matches org_role_permissions_outlet_unique
          set: { isEnabled, updatedAt: new Date() },
        });
    }

    return {
      success: true,
      data: {
        isEnabled,
        level: outletId ? "outlet" : "organization",
      },
    };
  } catch (error) {
    console.error("togglePermission error:", error);
    return {
      success: false,
      error:  "Failed to update permission",
      status: 500,
    };
  }
}
// ─────────────────────────────────────────────
// RESET ROLE PERMISSIONS
// ─────────────────────────────────────────────
export async function resetRolePermissions(
  organizationId: string,
  roleId:         string,
  outletId?:      string
): Promise<ControllerResult<null>> {

  const role = await db.query.roles.findFirst({
    where: (r, { eq }) => eq(r.id, roleId),
    columns: { name: true },
  });

  if (!role) {
    return { success: false, error: "Role not found", status: 404 };
  }
  if (PROTECTED_ROLES.includes(role.name)) {
    return { success: false, error: "Cannot reset Owner role", status: 403 };
  }

  try {
    if (outletId) {
      // ── reset outlet-specific overrides ──
      await db
        .delete(orgRolePermissions)
        .where(
          and(
            eq(orgRolePermissions.organizationId, organizationId),
            eq(orgRolePermissions.outletId,       outletId),
            eq(orgRolePermissions.roleId,          roleId)
          )
        );
    } else {
      // ── reset org-level overrides ──
      // ✅ direct isNull — fixes broken SQL bug
      await db
        .delete(orgRolePermissions)
        .where(
          and(
            eq(orgRolePermissions.organizationId, organizationId),
            isNull(orgRolePermissions.outletId),
            eq(orgRolePermissions.roleId,          roleId)
          )
        );
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("resetRolePermissions error:", error);
    return {
      success: false,
      error:  "Failed to reset permissions",
      status: 500,
    };
  }
}