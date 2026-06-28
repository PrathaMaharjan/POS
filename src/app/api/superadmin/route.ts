import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSuperAdminRefreshExpiry } from "@/lib/auth/superAdminJwt";
import { superAdminLogin } from "@/controller/superadmin/controller";

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