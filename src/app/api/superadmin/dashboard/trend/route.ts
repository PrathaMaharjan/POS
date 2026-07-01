import { getRegistrationTrend, TrendPeriod } from "@/controller/superadmin/dashboard/controller";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { NextRequest, NextResponse } from "next/server";

const VALID_PERIODS: TrendPeriod[] = ["7days", "30days", "1year"];

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;
  //    const periodParam = req.nextUrl.searchParams.get("period") ?? "1year";
  const periodParam = req.nextUrl.searchParams.get("period") ?? "1year";
  if (!VALID_PERIODS.includes(periodParam as TrendPeriod)) {
    return NextResponse.json(
      { error: `Invalid period. Use: ${VALID_PERIODS.join(", ")}` },
      { status: 400 },
    );
  }
  try {
    const data = await getRegistrationTrend(periodParam as TrendPeriod);
    return NextResponse.json(data);
  } catch (error) {
    console.error("getRegistrationTrend error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration trend" },
      { status: 500 },
    );
  }
}
