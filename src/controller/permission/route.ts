import { db } from "@/db";
import { orgRolePermissions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

// roles Owner cannot modify
const PROTECTED_ROLES = ["Owner"];

// permissions Owner cannot toggle
const PROTECTED_PERMISSIONS = ["core.outlets.delete", "core.roles.delete"];

export async function getRolePermissions(
  organizationId: string,
  roleId: string,
) {
  // ── 1. verify role exists and is not Owner ──
  const role = await db.query.roles.findFirst({
    where: (r, { eq }) => eq(r.id, roleId),
    columns: { id: true, name: true },
  });

  if (!role) {
    return { success: false, error: "Role not found", status: 404 };
  }

  if (PROTECTED_ROLES.includes(role.name)) {
    return {
      success: false,
      error: "Cannot modify Owner role permissions",
      status: 403,
    };
  }

  const allPermissions = await db.query.permissions.findMany({
    columns: {
      id: true,
      code: true,
      module: true,
      resource: true,
      action: true,
    },
    orderBy: (p, { asc }) => [asc(p.module), asc(p.resource), asc(p.action)],
  });
  // ── 3. get global role permissions ──
  const globalPerms = await db.query.rolePermissions.findMany({
    where: (rp, { eq }) => eq(rp.roleId, roleId),
    columns: { permissionId: true },
  });
  const globalPermIds = new Set(globalPerms.map((rp) => rp.permissionId));

  // ── 4. get org overrides ──
  const orgOverrides = await db.query.orgRolePermissions.findMany({
    where: (orp, { eq, and }) =>
      and(eq(orp.organizationId, organizationId), eq(orp.roleId, roleId)),
    columns: { permissionId: true, isEnabled: true },
  });
  const orgOverrideMap = new Map(
    orgOverrides.map((o) => [o.permissionId, o.isEnabled]),
  );
  // ── 5. build response with isEnabled flag ──
  const result = allPermissions.map((perm) => {
    // org override takes priority
    if (orgOverrideMap.has(perm.id)) {
      return {
        ...perm,
        isEnabled: orgOverrideMap.get(perm.id)!,
        isOverridden: true, // org has custom setting
        isProtected: PROTECTED_PERMISSIONS.includes(perm.code),
      };
    }


    return {
      ...perm,
      isEnabled: globalPermIds.has(perm.id),
      isOverridden: false, // using global default
      isProtected: PROTECTED_PERMISSIONS.includes(perm.code),
    };
  });
  // group by module for easier frontend rendering
  const grouped = result.reduce<Record<string, typeof result>>((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  return {
    success: true,
    data: {
      role,
      permissions: grouped,
    },
  };
}

export async function togglePermission(
  organizationId: string,
  roleId: string,
  permissionId: string,
  isEnabled: boolean,
): Promise<ControllerResult<{ isEnabled: boolean }>> {
  // ── 1. verify role is not protected ──
  const role = await db.query.roles.findFirst({
    where: (r, { eq }) => eq(r.id, roleId),
    columns: { name: true },
  });

  if (!role) {
    return { success: false, error: "Role not found", status: 404 };
  }

  if (PROTECTED_ROLES.includes(role.name)) {
    return {
      success: false,
      error: "Cannot modify Owner role permissions",
      status: 403,
    };
  }
  // ── 2. verify permission is not protected ──
  const permission = await db.query.permissions.findFirst({
    where: (p, { eq }) => eq(p.id, permissionId),
    columns: { code: true },
  });

  if (!permission) {
    return { success: false, error: "Permission not found", status: 404 };
  }

  if (PROTECTED_PERMISSIONS.includes(permission.code)) {
    return {
      success: false,
      error: `Permission "${permission.code}" cannot be modified`,
      status: 403,
    };
  }
  try {
    // ── 3. upsert — insert or update if exists ──
    await db
      .insert(orgRolePermissions)
      .values({
        organizationId,
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
        set: {
          isEnabled,
          updatedAt: new Date(),
        },
      });

    return { success: true, data: { isEnabled } };
  } catch (error) {
    console.error("togglePermission error:", error);
    return {
      success: false,
      error: "Failed to update permission",
      status: 500,
    };
  }
}

// ─────────────────────────────────────────────
// RESET ROLE PERMISSIONS
// removes all org overrides → reverts to global defaults
// ─────────────────────────────────────────────
export async function resetRolePermissions(
  organizationId: string,
  roleId: string
): Promise<ControllerResult<null>> {
  const role = await db.query.roles.findFirst({
    where: (r, { eq }) => eq(r.id, roleId),
    columns: { name: true },
  });

  if (!role) {
    return { success: false, error: "Role not found", status: 404 };
  }

  if (PROTECTED_ROLES.includes(role.name)) {
    return {
      success: false,
      error: "Cannot reset Owner role permissions",
      status: 403,
    };
  }

  try {
    await db
      .delete(orgRolePermissions)
      .where(
        and(
          eq(orgRolePermissions.organizationId, organizationId),
          eq(orgRolePermissions.roleId, roleId)
        )
      );

    return { success: true, data: null };
  } catch (error) {
    console.error("resetRolePermissions error:", error);
    return {
      success: false,
      error: "Failed to reset permissions",
      status: 500,
    };
  }
}
