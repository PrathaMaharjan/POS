import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requiredToken } from "@/lib/auth/requireAuth";
import { removeTable, updateTable, updateTableStatus } from "@/controller/tableController";
import { requiredPermission } from "@/lib/permissions/requirePermission";



const updateSchema = z.object({
  tableNumber: z.string().min(1).max(20).optional(),
  capacity: z.number().int().min(1).optional(),
  shape: z.enum(["square", "round","rectangle"]).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "restaurant.tables.update");
  if (permError) return permError;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Provide at least one field to update" }, { status: 400 });
  }

  const result = await updateTable(auth.payload.activeOutletId!, id, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "restaurant.tables.delete");
  if (permError) return permError;

  const result = await removeTable(auth.payload.activeOutletId!, id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}

