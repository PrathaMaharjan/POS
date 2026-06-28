import jwt from "jsonwebtoken";

const SECRET = process.env.SUPER_ADMIN_JWT_SECRET!;
const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

export interface SuperAdminPayload {
  superAdminId: string;
  email: string;
  isSuperAdmin: true;
}
// ─────────────────────────────────────────────
// SIGN
// ─────────────────────────────────────────────
export function signSuperAdminAccessToken(
  payload: Omit<SuperAdminPayload, "isSuperAdmin">,
): string {
  return jwt.sign({ ...payload, isSuperAdmin: true }, SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });
}

export function signSuperAdminRefreshToken(payload: {
  superAdminId: string;
  tokenId: string;
}): string {
  return jwt.sign(payload, SECRET, { expiresIn: REFRESH_EXPIRY });
}

// ─────────────────────────────────────────────
// VERIFY
// ─────────────────────────────────────────────
export function verifySuperAdminToken(token: string): SuperAdminPayload | null {
  try {
    const payload = jwt.verify(token, SECRET) as SuperAdminPayload;
    if (!payload.isSuperAdmin) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSuperAdminRefreshExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
