import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { getLowStockAlerts } from "@/controller/inventory/inventoy";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "inventory.stock.read");
  if (permError) return permError;

  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId")
  );
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status }
    );
  }

  try {
    const alerts = await getLowStockAlerts(resolved.outletId);
    return NextResponse.json({
      alerts,
      total:        alerts.length,
      outOfStock:   alerts.filter((a) => a.isOutOfStock).length,
      lowStock:     alerts.filter((a) => !a.isOutOfStock).length,
    });
  } catch (error) {
    console.error("getLowStockAlerts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock alerts" },
      { status: 500 }
    );
  }
}