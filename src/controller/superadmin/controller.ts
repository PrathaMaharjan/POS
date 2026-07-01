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

  
export async function updateSuperAdminProfile(
  superAdminId: string,
  input: {
    name?:            string;
    email?:           string;
    currentPassword?: string; // required only when changing password or email
    newPassword?:     string;
  },
): Promise<ControllerResult<{
  id:    string;
  name:  string;
  email: string;
}>> {
  const { name, email, currentPassword, newPassword } = input;

  // ── at least one field required ──
  if (!name && !email && !newPassword) {
    return {
      success: false,
      error:  "Provide at least one field to update",
      status: 400,
    };
  }

  // ── fetch current super admin ──
  const superAdmin = await db.query.superAdmins.findFirst({
    where: (sa, { eq }) => eq(sa.id, superAdminId),
    columns: {
      id:           true,
      name:         true,
      email:        true,
      passwordHash: true,
    },
  });

  if (!superAdmin) {
    return { success: false, error: "Super admin not found", status: 404 };
  }

  if ((email || newPassword) && !currentPassword) {
    return {
      success: false,
      error:  "Current password is required to change email or password",
      status: 400,
    };
  }

  if (currentPassword) {
    const valid = await verifyPassword(currentPassword, superAdmin.passwordHash);
    if (!valid) {
      return {
        success: false,
        error:  "Current password is incorrect",
        status: 401,
      };
    }
  }

  // ── build update values ──
  const updateValues: Record<string, unknown> = { updatedAt: new Date() };

  // name change — no password required
  if (name && name !== superAdmin.name) {
    updateValues.name = name;
  }

  // email change — requires password (already verified above)
  if (email && email !== superAdmin.email) {
    // check email not already taken by another super admin
    const existingEmail = await db.query.superAdmins.findFirst({
      where: (sa, { eq, and, ne }) =>
        and(
          eq(sa.email, email),
          ne(sa.id,    superAdminId) // exclude self
        ),
      columns: { id: true },
    });

    if (existingEmail) {
      return {
        success: false,
        error:  `Email "${email}" is already in use`,
        status: 409,
      };
    }

    updateValues.email = email;
  }

  // password change — requires current password (already verified above)
  if (newPassword) {
    // prevent reusing same password
    const isSame = await verifyPassword(newPassword, superAdmin.passwordHash);
    if (isSame) {
      return {
        success: false,
        error:  "New password must be different from current password",
        status: 400,
      };
    }

    updateValues.passwordHash = await hashPassword(newPassword);
  }

  // nothing actually changed
  if (Object.keys(updateValues).length === 1) {
    return {
      success: false,
      error:  "No changes detected",
      status: 400,
    };
  }

  try {
    const [updated] = await db
      .update(superAdmins)
      .set(updateValues)
      .where(eq(superAdmins.id, superAdminId))
      .returning({
        id:    superAdmins.id,
        name:  superAdmins.name,
        email: superAdmins.email,
      });

    return { success: true, data: updated };
  } catch (error) {
    console.error("updateSuperAdminProfile error:", error);
    return {
      success: false,
      error:  "Failed to update profile",
      status: 500,
    };
  }
}

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

// get detail
export async function getSuperAdminProfile(
  superAdminId: string
): Promise<ControllerResult<{
  id:        string;
  name:      string;
  email:     string;
  isActive:  boolean;
  createdAt: Date;
}>> {
  const superAdmin = await db.query.superAdmins.findFirst({
    where: (sa, { eq }) => eq(sa.id, superAdminId),
    columns: {
      id:        true,
      name:      true,
      email:     true,
      isActive:  true,
      createdAt: true,
    },
  });

  if (!superAdmin) {
    return { success: false, error: "Super admin not found", status: 404 };
  }

  return { success: true, data: superAdmin };
}
