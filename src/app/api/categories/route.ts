import { createCategory, getCategories } from "@/controller/category";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const categories = await getCategories(auth.payload.activeOutletId!);

  return NextResponse.json({ categories });
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;
  const permError = requiredPermission(
    auth.payload,
    "inventory.categories.create",
  );
  if (permError) return permError;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createCategory(
    auth.payload.activeOutletId!,
    parsed.data,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: 201 });
}
