import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { createStockItem, listStockItems } from "@/controller/inventory/stockItem";

const createSchema = z.object({
  name:          z.string().min(1).max(255),
  unit:          z.enum(["g", "kg", "ml", "L", "pieces"]),
  currentStock:  z.number().min(0).optional(),
  minStockLevel: z.number().min(0).optional(),
  outletId:      z.string().uuid().optional(),
});

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
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await listStockItems(resolved.outletId);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "inventory.stock.create");
  if (permError) return permError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { outletId: requestedOutletId, ...itemData } = parsed.data;

  const resolved = await resolveOutletId(auth.payload, requestedOutletId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await createStockItem(resolved.outletId, itemData);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 201 });
}