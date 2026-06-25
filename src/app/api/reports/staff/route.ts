import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { getActiveStaffCount } from "@/controller/managerdashboard";
// import { getActiveStaffCount } from "@/controller/managerdashboard";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  try {
    const activeStaff = await getActiveStaffCount(auth.payload.activeOutletId!);
    return NextResponse.json({ activeStaff });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staff count" },
      { status: 500 },
    );
  }
}
