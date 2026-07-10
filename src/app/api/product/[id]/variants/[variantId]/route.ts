import { deleteVariant, updateVariant } from "@/controller/productVeriant/contoller";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


const updateSchema = z.object({
  label:     z.string().min(1).max(50).optional(),
  price:     z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "Invalid price format").optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive:  z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { id, variantId } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const permError = requiredPermission(auth.payload, "inventory.products.update");
//   if (permError) return permError;

  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId")
  );
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const body   = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateVariant(resolved.outletId,id, variantId, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ variant: result.data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { id, variantId } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const permError = requiredPermission(auth.payload, "inventory.products.delete");
//   if (permError) return permError;

  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId")
  );
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await deleteVariant(resolved.outletId,id, variantId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}