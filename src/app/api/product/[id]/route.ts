import {
  getProductById,
  hardDeleteProduct,
  updateProduct,
} from "@/controller/product";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  categoryId: z.string().uuid().optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  imagePublicId: z.string().optional(),
  sortOrder: z.number().int().optional(),
  outletId: z.string().uuid().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

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
  const product = await getProductById(resolved.outletId, id);
  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(product);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(
    auth.payload,
    "inventory.products.delete",
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
  const result = await hardDeleteProduct(resolved.outletId, id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(
    auth.payload,
    "inventory.products.update",
  );
  if (permError) return permError;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one field to update" },
      { status: 400 },
    );
  }
  const { outletId: requestedOutletId, ...updateFields } = parsed.data;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one field to update" },
      { status: 400 },
    );
  }

  const resolved = await resolveOutletId(auth.payload, requestedOutletId);
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }

  const result = await updateProduct(resolved.outletId, id, updateFields);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}
