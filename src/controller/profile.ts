import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

export async function updateProfile(
  userId: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }
): Promise<ControllerResult<{
  id: string;
  name: string;
  email: string;
  phone: string | null;
}>> {
  const { name, email, phone, currentPassword, newPassword } = input;

  // ── 1. fetch current user ──
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
    columns: {
      id:           true,
      name:         true,
      email:        true,
      phone:        true,
      passwordHash: true,
    },
  });

  if (!user) {
    return { success: false, error: "User not found", status: 404 };
  }

  // ── 2. password change — only if BOTH fields are non-empty strings ──
  let newPasswordHash: string | undefined = undefined;

  const wantsPasswordChange =
    typeof currentPassword === "string" && currentPassword.length > 0 &&
    typeof newPassword     === "string" && newPassword.length     > 0;

  if (wantsPasswordChange) {
    // ── need at least one field but only one passed ──
    if (!currentPassword || !newPassword) {
      return {
        success: false,
        error: "Both currentPassword and newPassword are required to change password",
        status: 400,
      };
    }

    // ── no password set on account yet ──
    if (!user.passwordHash) {
      return {
        success: false,
        error: "No password set on this account",
        status: 400,
      };
    }

    // ── verify current password ──
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return {
        success: false,
        error: "Current password is incorrect",
        status: 401,
      };
    }

    // ── prevent reusing same password ──
    const isSame = await verifyPassword(newPassword, user.passwordHash);
    if (isSame) {
      return {
        success: false,
        error: "New password must be different from your current password",
        status: 400,
      };
    }

    newPasswordHash = await hashPassword(newPassword);
  }

  // ── 3. check email uniqueness if changing email ──
  if (email && email !== user.email) {
    const emailTaken = await db.query.users.findFirst({
      where: (u, { eq, and, ne }) =>
        and(eq(u.email, email), ne(u.id, userId)),
      columns: { id: true },
    });

    if (emailTaken) {
      return {
        success: false,
        error: "This email is already in use by another account",
        status: 409,
      };
    }
  }

  // ── 4. build update payload ──
  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (name            !== undefined) updateValues.name         = name;
  if (email           !== undefined) updateValues.email        = email;
  if (phone           !== undefined) updateValues.phone        = phone;
  if (newPasswordHash !== undefined) updateValues.passwordHash = newPasswordHash;

  if (Object.keys(updateValues).length === 1) {
    return {
      success: false,
      error: "Provide at least one field to update",
      status: 400,
    };
  }

  // ── 5. update ──
  try {
    const [updated] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, userId))
      .returning({
        id:    users.id,
        name:  users.name,
        email: users.email,
        phone: users.phone,
      });

    return { success: true, data: updated };
  } catch (error: any) {
    if (error?.code === "23505") {
      return {
        success: false,
        error: "This email is already in use by another account",
        status: 409,
      };
    }
    console.error("updateProfile error:", error);
    return { success: false, error: "Failed to update profile", status: 500 };
  }
}