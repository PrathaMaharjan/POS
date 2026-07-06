// import jwt from "jsonwebtoken";

// export interface AccessTokenPayload {
//   userId: string;
//   organizationId: string;
//   role: string | null;
//   activeOutletId: string | null;
//   permissions: string[];
// }

// export interface RefreshTokenPayload {
//   userId: string;
//   tokenId: string;
// }

// const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
// const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
// const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
// const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// export function signAccessToken(payload: AccessTokenPayload) {
//   return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN as any });
// }

// export function verifyAccessToken(token: string): AccessTokenPayload {
//   return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
// }

// export function signRefreshToken(payload: RefreshTokenPayload) {
//   return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN as any });
// }

// export function verifyRefreshToken(token: string): RefreshTokenPayload {
//   return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
// }

// export function getRefreshExpiryDate() {
//   const days = parseInt(REFRESH_EXPIRES_IN.replace("d", ""), 10) || 7;
//   return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
// }

import jwt from "jsonwebtoken";
import type { Plan } from "@/lib/permissions/planOrder"; // ← new import

export interface AccessTokenPayload {
  userId:         string;
  organizationId: string;
  role:           string | null;
  activeOutletId: string | null;
  permissions:    string[];
  plan:           Plan;             // ← ADD THIS FIELD
}

export interface RefreshTokenPayload {
  userId:  string;
  tokenId: string;
}

const ACCESS_SECRET       = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET      = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES_IN   = process.env.JWT_ACCESS_EXPIRES_IN  || "15m";
const REFRESH_EXPIRES_IN  = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN as any });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN as any });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}

export function getRefreshExpiryDate() {
  const days = parseInt(REFRESH_EXPIRES_IN.replace("d", ""), 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}






