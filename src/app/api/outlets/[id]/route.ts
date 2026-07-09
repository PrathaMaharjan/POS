import { deleteOutlet, updateOutlet } from "@/controller/outlets";
import { db } from "@/db";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const updateSchema = z.object({
  name:                z.string().min(1).max(255).optional(),
  address:             z.string().optional(),
  phone:               z.string().max(30).optional(),
  skipKitchenWorkflow: z.boolean().optional(),
  taxEnabled:          z.boolean().optional(),                              // ← new
  taxRate:             z.string().regex(/^\d{1,3}(\.\d{1,2})?$/).optional(), // ← new e.g. "13.00"
  taxName:             z.string().max(50).optional(),                       // ← new e.g. "VAT"
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

  const permError = requiredPermission(auth.payload, "core.outlets.update");
  if (permError) return permError;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one field to update" },
      { status: 400 }
    );
  }

  const result = await updateOutlet(auth.payload.organizationId, id, parsed.data);
  console.log(result)

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

  const permError = requiredPermission(auth.payload, "core.outlets.delete");
  if (permError) return permError;

  const result = await deleteOutlet(auth.payload.organizationId, id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}



export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  // const permError = requiredPermission(auth.payload, "core.outlets.read");
  // if (permError) return permError;

  const outlet = await db.query.outlets.findFirst({
    where: (o, { eq, and }) =>
      and(
        eq(o.id, id),
        eq(o.organizationId, auth.payload.organizationId) // ← tenant isolation
      ),
    columns: {
      id:                  true,
      name:                true,
      address:             true,
      phone:               true,
      isActive:            true,
      taxEnabled:          true,
      taxRate:             true,
      taxName:             true,
      skipKitchenWorkflow: true,
      createdAt:           true,
      updatedAt:           true,
    },
  });

  if (!outlet) {
    return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
  }

  return NextResponse.json({ outlet });
}