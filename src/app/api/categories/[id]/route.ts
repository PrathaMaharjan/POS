import { deleteCategory, updateCategory } from "@/controller/category";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().optional(),
});
export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(
    auth.payload,
    "inventory.categories.update",
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

  const result = await updateCategory(
    auth.payload.activeOutletId!,
    id,
    parsed.data,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
};
// -----------deleere----------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "inventory.categories.delete");
  if (permError) return permError;

  const result = await deleteCategory(auth.payload.activeOutletId!, id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}