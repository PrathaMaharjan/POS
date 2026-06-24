import { createProduct, listProducts } from "@/controller/product";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  categoryId: z.string().uuid(),
  price: z.number().positive(),
  description: z.string().optional(),
  imagePublicId: z.string().optional(), // key from Cloudinary, not a URL
  sortOrder: z.number().int().optional(),
});

// create product
export async function POST(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "inventory.products.create");
  if (permError) return permError;

  const body = await req.json();

  // Owner can optionally pass outletId in body to target a specific outlet
  const resolved = await resolveOutletId(auth.payload, body.outletId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createProduct(resolved.outletId, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 201 });
}

// get product by category yo chi more optimize xa so use this one 
export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const searchParams = req.nextUrl.searchParams;

  // Owner can pass ?outletId= to query a specific outlet
  const resolved = await resolveOutletId(auth.payload, searchParams.get("outletId"));
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const categoryId = searchParams.get("categoryId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  const result = await listProducts(resolved.outletId, categoryId || undefined, limit, offset);

  return NextResponse.json({
    ...result,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  });
}