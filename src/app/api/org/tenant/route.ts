import { getOwnOrganization, updateOwnOrganization } from "@/controller/org/tenant/controller";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
const updateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  imagePublicId: z.string().optional(),
});
export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.outlets.read");
  if (permError) return permError;

  const result = await getOwnOrganization(auth.payload.organizationId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}

export async function PATCH(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.outlets.update");
  if (permError) return permError;

  const body   = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateOwnOrganization(
    auth.payload.organizationId,
    parsed.data
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}
