import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken, SuperAdminPayload } from "./superAdminJwt";

type RequireSuperAdminResult =
  | { ok: true; payload: SuperAdminPayload }
  | { ok: false; response: NextResponse };

export async function requireSuperAdmin(
  req: NextRequest,
): Promise<RequireSuperAdminResult> {
  // ── read token from cookie or Authorization header ──
  const cookieToken = req.cookies.get("superAdminToken")?.value;
  const headerToken = req.headers.get("Authorization")?.replace("Bearer ", "");
  const token = cookieToken ?? headerToken;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Super Admin authentication required" },
        { status: 401 },
      ),
    };
  }
  const payload = verifySuperAdminToken(token);

  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or expired Super Admin token" },
        { status: 401 },
      ),
    };
  }

  return { ok: true, payload };
}
