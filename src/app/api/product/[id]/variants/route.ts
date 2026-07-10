import { createVariant, listVariants } from "@/controller/productVeriant/contoller";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


const createSchema = z.object({
  label:     z.string().min(1).max(50),
  price:     z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "Invalid price format"),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const permError = requiredPermission(auth.payload, "inventory.products.read");
//   if (permError) return permError;

  // ── resolve + verify outlet ownership in one call ──
  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId")
  );
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await listVariants(resolved.outletId,id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ variants: result.data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createVariant(resolved.outletId, id, parsed.data);


  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ variant: result.data }, { status: 201 });
}