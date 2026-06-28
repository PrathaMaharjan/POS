import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { getStockMovements } from "@/controller/inventory/stockItem";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "inventory.stock.read");
  if (permError) return permError;

  const searchParams = req.nextUrl.searchParams;
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page   = Math.max(parseInt(searchParams.get("page")  ?? "1"),  1);
  const offset = (page - 1) * limit;

  const resolved = await resolveOutletId(
    auth.payload,
    searchParams.get("outletId")
  );
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await getStockMovements(resolved.outletId, id, limit, offset);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ...result.data,
    pagination: {
      page,
      limit,
      total:      result.data.total,
      totalPages: Math.ceil(result.data.total / limit),
    },
  });
}