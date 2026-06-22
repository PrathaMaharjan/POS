import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { getSalesTrend, TrendPeriod } from "@/controller/managerdashboard";

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
    const salesTrend = await getSalesTrend(auth.payload.activeOutletId!, period);
    return NextResponse.json({ salesTrend });
  } catch (error) {
    console.error("getSalesTrend error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales trend" },
      { status: 500 }
    );
  }
}