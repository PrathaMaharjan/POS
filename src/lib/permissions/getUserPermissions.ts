// import { db } from "@/db";
// import { userOutletRoles, rolePermissions, permissions } from "@/db/schema";
// import { eq, and } from "drizzle-orm";

import { db } from "@/db";

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

export async function getUserRoleForOutlet(userId: string, outletId: string) {
  const result = await db.query.userOutletRoles.findFirst({
    where: (uor, { eq, and }) => and(eq(uor.userId, userId), eq(uor.outletId, outletId)),
    with: { role: true },
  });

  return result?.role ?? null; // { id, name, organizationId, isSystem } or null
}