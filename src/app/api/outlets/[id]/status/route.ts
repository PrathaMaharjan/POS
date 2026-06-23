import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { updateOutletStatus } from "@/controller/outlets";

const schema = z.object({ isActive: z.boolean() });

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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateOutletStatus(
    auth.payload.organizationId,
    id,
    parsed.data.isActive
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}