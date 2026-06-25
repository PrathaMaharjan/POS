import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { getTotalRevenue } from "@/controller/managerdashboard";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;
  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId"),
  );
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }
  try {
    const totalRevenue = await getTotalRevenue(resolved.outletId);
    return NextResponse.json({ totalRevenue });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch revenue" },
      { status: 500 },
    );
  }
}
