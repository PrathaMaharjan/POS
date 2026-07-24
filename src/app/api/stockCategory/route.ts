import { createStockCategory, listStockCategories } from "@/controller/stockCategpry/controller";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const createSchema = z.object({
  name:      z.string().min(1).max(100),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const planError = requirePlan(auth.payload, "pro");
//   if (planError) return planError;

  const permError = requiredPermission(auth.payload, "inventory.stock.read");
  if (permError) return permError;

  const resolved = await resolveOutletId(auth.payload, req.nextUrl.searchParams.get("outletId"));
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await listStockCategories(resolved.outletId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ categories: result.data });
}

// ---------------------- create stock ----------------------------------
export async function POST(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const planError = requirePlan(auth.payload, "pro");
//   if (planError) return planError;

  const permError = requiredPermission(auth.payload, "inventory.stock.create");
  if (permError) return permError;

  const resolved = await resolveOutletId(auth.payload, req.nextUrl.searchParams.get("outletId"));
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const body   = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createStockCategory(resolved.outletId, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ category: result.data }, { status: 201 });
}