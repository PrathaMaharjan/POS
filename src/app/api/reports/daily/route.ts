import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { getDailyReport } from "@/modules/pos/controller/payment";
// import { requirePermission } from "@/lib/permissions/requirePermission";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const permError = requirePermission(auth.payload, "pos.shift_reports.read");
//   if (permError) return permError;

  // optional ?date=2026-06-21 (Nepal date) — defaults to today
  const dateStr = req.nextUrl.searchParams.get("date") ?? undefined;

  try {
    const report = await getDailyReport(auth.payload.activeOutletId!, dateStr);
    return NextResponse.json(report);
  } catch (error) {
    console.error("getDailyReport error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}