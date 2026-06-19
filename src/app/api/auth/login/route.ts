import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { refreshTokens } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import {
  signAccessToken,
  signRefreshToken,
  getRefreshExpiryDate,
} from "@/lib/auth/jwt";
import {
  getUserPermissionsForOutlet,
  getUserRoleForOutlet,
} from "@/lib/permissions/getUserPermissions";
import { hashToken } from "@/lib/auth/hashtoken";

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    // ── 1. Find user ──
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
      with: { organization: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in" },
        { status: 403 },
      );
    }

    // ── 2. Verify password + fetch outlets in parallel ──
    const [valid, userOutletRows] = await Promise.all([
      verifyPassword(password, user.passwordHash),
      db.query.userOutlets.findMany({
        where: (uo, { eq }) => eq(uo.userId, user.id),
        with: { outlet: true },
      }),
    ]);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // ── 3. Resolve active outlet + permissions + role ──
    let activeOutletId: string | null = null;
    let permissions: string[] = [];
    let role: string | null = null;

    if (userOutletRows.length === 1) {
      activeOutletId = userOutletRows[0].outletId;

      const [perms, roleRow] = await Promise.all([
        getUserPermissionsForOutlet(user.id, activeOutletId),
        getUserRoleForOutlet(user.id, activeOutletId),
      ]);

      permissions = perms;
      role = roleRow?.name ?? null;
    }

    // ── 4. Sign access token ──
    const accessToken = signAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      activeOutletId,
      permissions,
      role,
    });

    // ── 5. Create refresh token — single insert using pre-generated UUID ──
    const tokenId = randomUUID();
    const refreshToken = signRefreshToken({ userId: user.id, tokenId });

    await db.insert(refreshTokens).values({
      id: tokenId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshExpiryDate(),
    });

    // ── 6. Build response ──
    const response = NextResponse.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isOwner: user.isOwner,
        organizationId: user.organizationId,
        slug: user.organization.slug,
      },
      role,
      permissions,
      outlets: userOutletRows.map((uo) => ({
        id: uo.outlet.id,
        name: uo.outlet.name,
      })),
      activeOutletId,
      requiresOutletSelection: userOutletRows.length > 1,
    });

    // ── 7. Set cookies ──
    response.cookies.set("refreshToken", refreshToken, {
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
  } catch (error) {
    console.log(error);
  }
}
