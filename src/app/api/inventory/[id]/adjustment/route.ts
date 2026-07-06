import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { adjustStockItem } from "@/controller/inventory/stockItem";
import { requirePlan } from "@/lib/permissions/requirePlan";

const schema = z.object({
  newQuantity: z.number().min(0),
  note:        z.string().optional(),
  outletId:    z.string().uuid().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  // const planError = requirePlan(auth.payload, "pro");
  // if (planError) return planError;

  const permError = requiredPermission(auth.payload, "inventory.stock.update");
  if (permError) return permError;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { outletId: requestedOutletId, ...data } = parsed.data;

  const resolved = await resolveOutletId(auth.payload, requestedOutletId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await adjustStockItem(
    resolved.outletId,
    id,
    data,
    auth.payload.userId
  );
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}