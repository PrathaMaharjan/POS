import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSuperAdminRefreshExpiry } from "@/lib/auth/superAdminJwt";
import { getSuperAdminProfile, superAdminLogin } from "@/controller/superadmin/controller";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await superAdminLogin(parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { accessToken, refreshToken, superAdmin } = result.data;

    const response = NextResponse.json({
      accessToken,
      superAdmin,
    });

    // ── set cookies ──
    const cookieOptions = {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path:     "/",
      expires:  getSuperAdminRefreshExpiry(),
    };

    response.cookies.set("superAdminToken",        accessToken,  cookieOptions);
    response.cookies.set("superAdminRefreshToken", refreshToken, cookieOptions);

    return response;
  } catch (error) {
    console.error("Super admin login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}



export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const result = await getSuperAdminProfile(auth.payload.superAdminId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ superAdmin: result.data });
}