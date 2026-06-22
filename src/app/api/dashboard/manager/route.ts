import { getDashboardData, TrendPeriod } from "@/controller/managerdashboard";
import { requiredToken } from "@/lib/auth/requireAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const period = (req.nextUrl.searchParams.get("period") ?? "hourly") as TrendPeriod;

  if (!["hourly", "weekly", "monthly"].includes(period)) {
    return NextResponse.json(
      { error: "period must be hourly, weekly, or monthly" },
      { status: 400 }
    );
  }

  try {
    const data = await getDashboardData(
      auth.payload.activeOutletId!,
      period
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}