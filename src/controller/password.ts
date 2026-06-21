import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

export const chnagePassword = async (
  userId: string,
  input: { currentPassword: string; newPassword: string },
) => {
  try {
    const { currentPassword, newPassword } = input;
    // ── 1. Fetch user ──
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
      columns: { id: true, passwordHash: true },
    });

    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return {
        success: false,
        error: "Current password is incorrect",
        status: 401,
      };
    }
    const newHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true, data: null };
  } catch (error) {
    console.error("changePassword error:", error);
    return { success: false, error: "Failed to update password", status: 500 };
  }
};
