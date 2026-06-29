import { deleteOrganization, getOrganization, updateOrganization } from "@/controller/superadmin/oragnization/controller";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth   = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const result = await getOrganization(id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth   = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const result = await deleteOrganization(id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true });
}

const updateSchema = z.object({
  name:          z.string().min(2).max(255).optional(),
  imagePublicId: z.string().optional(), 
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth   = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const body   = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateOrganization(id, parsed.data);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}