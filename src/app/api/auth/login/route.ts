import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {  refreshTokens } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken, getRefreshExpiryDate } from "@/lib/auth/jwt";
import { hashToken } from "@/lib/auth/hashtoken";


const schema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
    with :{ organization : true }
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const userOutletRows = await db.query.userOutlets.findMany({
    where: (uo, { eq }) => eq(uo.userId, user.id),
    with: { outlet: true },
  });

  let activeOutletId: string | null = null;
  let permissions: string[] = [];

  if (userOutletRows.length === 1) {
    activeOutletId = userOutletRows[0].outletId;
    // permissions = await getUserPermissionsForOutle(user.id, activeOutletId);
  }

  const accessToken = signAccessToken({
    userId: user.id,
    organizationId: user.organizationId,
    activeOutletId,
    permissions,
  });

  const [tokenRecord] = await db
    .insert(refreshTokens)
    .values({ userId: user.id, tokenHash: "pending", expiresAt: getRefreshExpiryDate() })
    .returning();

  const refreshToken = signRefreshToken({ userId: user.id, tokenId: tokenRecord.id });

  await db
    .update(refreshTokens)
    .set({ tokenHash: hashToken(refreshToken) })
    .where(eq(refreshTokens.id, tokenRecord.id));

  const response = NextResponse.json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isOwner: user.isOwner,
      organizationId: user.organizationId,
      slug : user.organization.slug
    },
    outlets: userOutletRows.map((uo) => ({ id: uo.outlet.id, name: uo.outlet.name })),
    activeOutletId,
    requiresOutletSelection: userOutletRows.length > 1,
  });

  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: getRefreshExpiryDate(),
  });

  return response;
}