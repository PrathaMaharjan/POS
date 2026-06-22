import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { getTotalRevenue } from "@/controller/managerdashboard";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  try {
    const totalRevenue = await getTotalRevenue(auth.payload.activeOutletId!);
    return NextResponse.json({ totalRevenue });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
  }
}