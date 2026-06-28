import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const response = NextResponse.json({ success: true });

  // ── clear cookies ──
  response.cookies.set("superAdminToken", "", { maxAge: 0, path: "/" });
  response.cookies.set("superAdminRefreshToken", "", { maxAge: 0, path: "/" });

  return response;
}
