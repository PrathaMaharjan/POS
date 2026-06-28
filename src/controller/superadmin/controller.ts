import { db } from "@/db";
import { superAdmins } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  signSuperAdminAccessToken,
  signSuperAdminRefreshToken,
} from "@/lib/auth/superAdminJwt";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

export async function superAdminLogin(input: {
  email: string;
  password: string;
}): Promise<
  ControllerResult<{
    accessToken: string;
    refreshToken: string;
    superAdmin: {
      id: string;
    };
  }>
> {
  const { email, password } = input;
  const superAdmin = await db.query.superAdmins.findFirst({
    where: (sa, { eq }) => eq(sa.email, email),
    columns: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!superAdmin) {
    return {
      success: false,
      error: "Invalid credentials",
      status: 401,
    };
  }
  if (!superAdmin.isActive) {
    return {
      success: false,
      error: "This account has been deactivated",
      status: 403,
    };
  }
  const valid = await verifyPassword(password, superAdmin.passwordHash);
  if (!valid) {
    return {
      success: false,
      error: "Invalid credentials",
      status: 401,
    };
  }
  //   access token
  const accessToken = signSuperAdminAccessToken({
    superAdminId: superAdmin.id,
    email: superAdmin.email,
  });
  //sign refresh token ──
  const tokenId = randomUUID();
  const refreshToken = signSuperAdminRefreshToken({
    superAdminId: superAdmin.id,
    tokenId,
  });

  return {
    success: true,
    data: {
      accessToken,
      refreshToken,
      superAdmin: {
        id: superAdmin.id,
      },
    },
  };
}

export async function changeSuperAdminPassword(
  superAdminId: string,
  input: {
    currentPassword: string;
    newPassword: string;
  },
): Promise<ControllerResult<null>> {
  const { currentPassword, newPassword } = input;

  const superAdmin = await db.query.superAdmins.findFirst({
    where: (sa, { eq }) => eq(sa.id, superAdminId),
    columns: {
      id: true,
      passwordHash: true,
    },
  });

  if (!superAdmin) {
    return { success: false, error: "Super admin not found", status: 404 };
  }

  // ── verify current password ──
  const valid = await verifyPassword(currentPassword, superAdmin.passwordHash);
  if (!valid) {
    return {
      success: false,
      error: "Current password is incorrect",
      status: 401,
    };
  }

  // ── prevent reusing same password ──
  const isSame = await verifyPassword(newPassword, superAdmin.passwordHash);
  if (isSame) {
    return {
      success: false,
      error: "New password must be different from current password",
      status: 400,
    };
  }

  const newPasswordHash = await hashPassword(newPassword);

  await db
    .update(superAdmins)
    .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
    .where(eq(superAdmins.id, superAdminId));

  return { success: true, data: null };
}
