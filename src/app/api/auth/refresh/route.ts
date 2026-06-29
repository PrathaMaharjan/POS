import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { refreshTokens } from "@/db/schema";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  getRefreshExpiryDate,
} from "@/lib/auth/jwt";
import { hashToken } from "@/lib/auth/hashtoken";
import {
  getUserPermissionsForOutlet,
  getUserRoleForOutlet,
} from "@/lib/permissions/getUserPermissions";

export async function POST(req: NextRequest) {
  // ── 1. Read refresh token from httpOnly cookie ──
  const token = req.cookies.get("refreshToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  // ── 2. Verify JWT signature ──
  let payload: { userId: string; tokenId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  // ── 3. Look up token record + user in parallel ──
  const [record, user] = await Promise.all([
    db.query.refreshTokens.findFirst({
      where: (t, { eq }) => eq(t.id, payload.tokenId),
    }),
    db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, payload.userId),
    }),
  ]);

  // ── 4. Validate token record ──
  if (!record || record.revoked || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Refresh token expired or revoked" },
      { status: 401 }
    );
  }

  if (record.tokenHash !== hashToken(token)) {
    return NextResponse.json({ error: "Token mismatch" }, { status: 401 });
  }

  // ── 5. Validate user ──
  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "User not found or inactive" },
      { status: 401 }
    );
  }

  // ── 6. Read activeOutletId from request body ──
  const body = await req.json().catch(() => ({}));
  const activeOutletId: string | null = body.activeOutletId ?? null;

  // ── 7. Fetch permissions + role (parallel if outletId exists) ──
  let permissions: string[] = [];
  let role: string | null = null;

  if (activeOutletId) {
    const [perms, roleRow] = await Promise.all([
      getUserPermissionsForOutlet(user.id, activeOutletId),
      getUserRoleForOutlet(user.id, activeOutletId),
    ]);
    permissions = perms;
    role = roleRow?.name ?? null;
  }

  // ── 8. Sign new access token ──
  const newAccessToken = signAccessToken({
    userId: user.id,
    organizationId: user.organizationId,
    activeOutletId,
    role,
    permissions,
  });

  // ── 9. Rotate refresh token (revoke old + insert new in parallel, 1 insert instead of 3) ──
  const newTokenId = randomUUID();
  const newRefreshToken = signRefreshToken({
    userId: user.id,
    tokenId: newTokenId,
  });

  await Promise.all([
    db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, record.id)),
    db.insert(refreshTokens).values({
      id: newTokenId,
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: getRefreshExpiryDate(),
    }),
  ]);

  // ── 10. Return new access token + set new refresh token cookie ──
  const response = NextResponse.json({
    accessToken: newAccessToken,
    role,
    permissions,
  });

  response.cookies.set("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: getRefreshExpiryDate(),
  });

  response.cookies.set("role", role ?? "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: getRefreshExpiryDate(),
  });

  return response;
}

