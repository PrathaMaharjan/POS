// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailVerificationTokens, users } from "@/db/schema";
import { hashToken } from "@/lib/auth/hashtoken";
// import { hashToken } from "@/lib/auth/hashToken";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?status=missing", req.url));
  }

  const tokenHash = hashToken(token);

  const record = await db.query.emailVerificationTokens.findFirst({
    where: (t, { eq, and, isNull }) => and(eq(t.tokenhash, tokenHash), isNull(t.usedAt)),
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", req.url));
  }

  await db.update(users).set({ emailVerified: true }).where(eq(users.id, record.userid));
  await db.update(emailVerificationTokens).set({ usedAt: new Date() }).where(eq(emailVerificationTokens.id, record.id));

  return NextResponse.redirect(new URL("/verify-email?status=success", req.url));
}