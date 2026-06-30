import { db } from "@/db";
import { roles, userOutletRoles, userOutlets, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { sendStaffWelcomeEmail } from "@/lib/email/sendStaffWelcomeEmail";
import { and, eq, notInArray, sql } from "drizzle-orm";

const FRONTLINE_ROLES = ["Cashier", "Waiter", "Kitchen Crew"];

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

const ASSIGNABLE_ROLES = ["Manager", "Cashier", "Waiter", "Kitchen Crew"];

async function getFrontlineRoleId(roleName: string): Promise<string | null> {
  if (!ASSIGNABLE_ROLES.includes(roleName)) return null;
  const role = await db.query.roles.findFirst({
    where: (r, { eq, and, isNull }) =>
      and(eq(r.name, roleName), isNull(r.organizationId)),
  });
  return role?.id ?? null;
}

// -------------create staff -------------------

export async function createStaff(
  organizationId: string,
  outletId: string,
  input: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    password: string;
  },
): Promise<ControllerResult<{ userId: string }>> {
  try {
    const { name, email, phone, role, password } = input;
    const roleId = await getFrontlineRoleId(role);
    if (!roleId) {
      return {
        success: false,
        error: "Role must be Cashier, Waiter, or Kitchen Crew",
        status: 400,
      };
    }
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });
    if (existing) {
      return {
        success: false,
        error:
          "A user with this email already exists. Use 'assign existing' instead.",
        status: 409,
      };
    }
    const outlet = await db.query.outlets.findFirst({
      where: (o, { eq }) => eq(o.id, outletId),
    });
    if (!outlet) {
      return { success: false, error: "Outlet not found", status: 404 };
    }
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        organizationId,
        name,
        email,
        phone: phone ?? null,
        passwordHash,
        isOwner: false,
        emailVerified: true, // admin-created, no separate verification needed
      })
      .returning();

    await db.insert(userOutlets).values({ userId: newUser.id, outletId });
    await db
      .insert(userOutletRoles)
      .values({ userId: newUser.id, outletId, roleId });
    try {
      await sendStaffWelcomeEmail(email, name, password, outlet.name, role);
    } catch (err) {
      console.error("Failed to send staff welcome email:", err);
    }

    return { success: true, data: { userId: newUser.id } };
  } catch (error) {
    console.error("createStaff error:", error);
    return {
      success: false,
      error: "Failed to create staff member",
      status: 500,
    };
  }
}
//---------------- update status ------------
export async function updateStaffRole(
  outletId: string,
  userId: string,
  newRole: string
): Promise<ControllerResult<{ userId: string; role: string }>> {
  const roleId = await getFrontlineRoleId(newRole);
  if (!roleId) {
    return { success: false, error: "Role must be Cashier, Waiter, or Kitchen Crew", status: 400 };
  }

  const existing = await db.query.userOutletRoles.findFirst({
    where: (uor, { eq, and }) => and(eq(uor.userId, userId), eq(uor.outletId, outletId)),
  });
  if (!existing) {
    return { success: false, error: "Staff member not found at this outlet", status: 404 };
  }

  await db
    .update(userOutletRoles)
    .set({ roleId })
    .where(and(eq(userOutletRoles.userId, userId), eq(userOutletRoles.outletId, outletId)));

  return { success: true, data: { userId, role: newRole } };
}

// ---------------delete staff ----------------------

export async function removeStaff(outletId: string, userId: string): Promise<ControllerResult<null>> {
  const existing = await db.query.userOutletRoles.findFirst({
    where: (uor, { eq, and }) => and(eq(uor.userId, userId), eq(uor.outletId, outletId)),
  });
  if (!existing) {
    return { success: false, error: "Staff member not found at this outlet", status: 404 };
  }

  await db.delete(userOutletRoles).where(and(eq(userOutletRoles.userId, userId), eq(userOutletRoles.outletId, outletId)));
  await db.delete(userOutlets).where(and(eq(userOutlets.userId, userId), eq(userOutlets.outletId, outletId)));

  return { success: true, data: null };
}

// ----------------------get single staff data -----------------------------

export async function getStaffById(outletId: string, userId: string) {
  const row = await db.query.userOutletRoles.findFirst({
    where: (uor, { eq, and }) => and(eq(uor.userId, userId), eq(uor.outletId, outletId)),
    with: {
      user: { columns: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
      role: { columns: { name: true } },
    },
  });

  if (!row) return null;

  return {
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    phone: row.user.phone,
    isActive: row.user.isActive,
    createdAt: row.user.createdAt,
    role: row.role.name,
  };

}

// --------------set All Staff --------------------



export async function listStaff(
  outletId: string,
  limit: number,
  offset: number,
  includeManagers: boolean = false  // ← new param
) {
  const EXCLUDED_ROLES = includeManagers
    ? ["Owner"]                // Owner sees everyone except Owner
    : ["Owner", "Manager"];    // Manager sees frontline only

  const baseFilter = and(
    eq(userOutletRoles.outletId, outletId),
    notInArray(roles.name, EXCLUDED_ROLES)
  );

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        userId:   users.id,
        name:     users.name,
        email:    users.email,
        phone:    users.phone,
        isActive: users.isActive,
        role:     roles.name,
      })
      .from(userOutletRoles)
      .innerJoin(users, eq(userOutletRoles.userId, users.id))
      .innerJoin(roles, eq(userOutletRoles.roleId, roles.id))
      .where(baseFilter)
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(userOutletRoles)
      .innerJoin(roles, eq(userOutletRoles.roleId, roles.id))
      .where(baseFilter),
  ]);

  return {
    staff: rows,
    total: Number(totalResult[0]?.count ?? 0),
  };
}

// ------------change status ----------------------

async function setStaffActiveStatus(
  outletId: string,
  userId: string,
  isActive: boolean
): Promise<ControllerResult<{ userId: string; isActive: boolean }>> {
  // Confirm this staff member actually belongs to this outlet (tenant isolation)
  const existing = await db.query.userOutletRoles.findFirst({
    where: (uor, { eq, and }) => and(eq(uor.userId, userId), eq(uor.outletId, outletId)),
  });
  if (!existing) {
    return { success: false, error: "Staff member not found at this outlet", status: 404 };
  }

  const [updated] = await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return { success: true, data: { userId: updated.id, isActive: updated.isActive } };
}

export async function activateStaff(outletId: string, userId: string) {
  return setStaffActiveStatus(outletId, userId, true);
}

export async function deactivateStaff(outletId: string, userId: string) {
  return setStaffActiveStatus(outletId, userId, false);
}



// ─────────────────────────────────────────────
// ASSIGN AN EXISTING ORG USER TO THIS OUTLET
// ─────────────────────────────────────────────
export async function assignExistingStaff(
  organizationId: string,
  outletId: string,
  input: { email: string; role: string }
): Promise<ControllerResult<{ userId: string }>> {
  const { email, role } = input;

  const roleId = await getFrontlineRoleId(role);
  if (!roleId) {
    return { success: false, error: "Role must be Cashier, Waiter, or Kitchen Crew", status: 400 };
  }

  const targetUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) });
  if (!targetUser) {
    return { success: false, error: "No user found with this email. Use 'create' to add a new account.", status: 404 };
  }

  if (targetUser.organizationId !== organizationId) {
    return { success: false, error: "This user belongs to a different organization", status: 403 };
  }

  const alreadyAssigned = await db.query.userOutlets.findFirst({
    where: (uo, { eq, and }) => and(eq(uo.userId, targetUser.id), eq(uo.outletId, outletId)),
  });
  if (alreadyAssigned) {
    return { success: false, error: "This user already has access to this outlet", status: 409 };
  }

  try {
    await db.insert(userOutlets).values({ userId: targetUser.id, outletId });
    await db.insert(userOutletRoles).values({ userId: targetUser.id, outletId, roleId });

    return { success: true, data: { userId: targetUser.id } };
  } catch (error) {
    console.error("assignExistingStaff error:", error);
    return { success: false, error: "Failed to assign staff member", status: 500 };
  }
}


// update 

export async function updateStaffInfo(
  outletId: string,
  userId: string,
  input: { name?: string; phone?: string; email?: string }
): Promise<ControllerResult<{ userId: string; name: string; email: string; phone: string | null }>> {
  const { name, phone, email } = input;

  // Confirm this staff member belongs to this outlet (tenant isolation)
  const existing = await db.query.userOutletRoles.findFirst({
    where: (uor, { eq, and }) => and(eq(uor.userId, userId), eq(uor.outletId, outletId)),
  });
  if (!existing) {
    return { success: false, error: "Staff member not found at this outlet", status: 404 };
  }

  // If changing email, make sure it isn't already taken by someone else
  if (email) {
    const emailTaken = await db.query.users.findFirst({
      where: (u, { eq, and, ne }) => and(eq(u.email, email), ne(u.id, userId)),
    });
    if (emailTaken) {
      return { success: false, error: "This email is already in use by another account", status: 409 };
    }
  }

  // Only update fields that were actually provided
  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updateValues.name = name;
  if (phone !== undefined) updateValues.phone = phone;
  if (email !== undefined) updateValues.email = email;

  try {
    const [updated] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, userId))
      .returning();

    return {
      success: true,
      data: { userId: updated.id, name: updated.name, email: updated.email, phone: updated.phone },
    };
  } catch (error) {
    console.error("updateStaffInfo error:", error);
    return { success: false, error: "Failed to update staff information", status: 500 };
  }
}
