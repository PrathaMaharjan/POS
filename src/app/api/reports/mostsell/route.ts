import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { getTopProducts } from "@/controller/managerdashboard";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "3"),
    10,
  );

  try {
    const topProducts = await getTopProducts(
      auth.payload.activeOutletId!,
      limit,
    );
    return NextResponse.json({ topProducts });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch top products" },
      { status: 500 },
    );
  }
}
