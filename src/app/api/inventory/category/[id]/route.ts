import { getStockItemById, getStockItemsByCategory } from "@/controller/inventory/stockItem";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  // const planError = requirePlan(auth.payload, "pro");
  // if (planError) return planError;


  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId")
  );
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await getStockItemsByCategory(resolved.outletId,id)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}