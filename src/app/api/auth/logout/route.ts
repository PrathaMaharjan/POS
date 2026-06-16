import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { refreshTokens } from "@/db/schema";
import { verifyRefreshToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("refreshToken")?.value;

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, payload.tokenId));
    } catch {
  
    }
  }

  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("refreshToken");
  return response;
}