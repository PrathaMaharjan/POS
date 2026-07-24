import { deleteStockCategory, getStockCategoryById, updateStockCategory } from "@/controller/stockCategpry/controller";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { requirePlan } from "@/lib/permissions/requirePlan";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


const updateSchema = z.object({
  name:      z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().optional(),
  isActive:  z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const planError = requirePlan(auth.payload, "pro");
//   if (planError) return planError;

  const permError = requiredPermission(auth.payload, "inventory.stock.update");
  if (permError) return permError;

  const resolved = await resolveOutletId(auth.payload, req.nextUrl.searchParams.get("outletId"));
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const body   = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateStockCategory(resolved.outletId, id, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ category: result.data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  // const planError = requirePlan(auth.payload, "pro");
  // if (planError) return planError;

  const permError = requiredPermission(auth.payload, "inventory.stock.delete");
  if (permError) return permError;

  const resolved = await resolveOutletId(auth.payload, req.nextUrl.searchParams.get("outletId"));
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await deleteStockCategory(resolved.outletId, id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  req: NextRequest,
  { params }: RouteProps,
) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  // const planError = requirePlan(auth.payload, "pro");
  // if (planError) return planError;

  const permError = requiredPermission(
    auth.payload,
    "inventory.stock.read",
  );
  if (permError) return permError;

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

  const { id } = await params;

  const result = await getStockCategoryById(
    id,
    resolved.outletId,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
   return NextResponse.json({
    category: result.data,
  });
}