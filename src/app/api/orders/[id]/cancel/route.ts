import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
// import { requirePermission } from "@/lib/permissions/requirePermission";
import { cancelOrder } from "@/controller/orderController";
import { requiredPermission } from "@/lib/permissions/requirePermission";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "pos.billing.update");
  if (permError) return permError;

  const result = await cancelOrder(auth.payload.activeOutletId!, id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ order: result.data });
}