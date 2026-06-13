// import { db } from "@/db";
// import { userOutletRoles, rolePermissions, permissions } from "@/db/schema";
// import { eq, and } from "drizzle-orm";

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