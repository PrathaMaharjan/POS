import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { getDateRange, getSalesTrend } from "@/controller/org/controller";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "pos.shift_reports.read");
  if (permError) return permError;

  const searchParams = req.nextUrl.searchParams;
  const period   = (searchParams.get("period")   ?? "7d") as "7d" | "30d" | "90d";
  const outletId = searchParams.get("outletId") ?? null;

  try {
    const { start, end } = getDateRange(period);
    const data = await getSalesTrend(
      auth.payload.organizationId,
      outletId,
      period,
      start,
      end
    );
    return NextResponse.json({ salesTrend: data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sales trend" }, { status: 500 });
  }
}