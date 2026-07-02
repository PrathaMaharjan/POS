import { getRolePermissions, togglePermission } from "@/controller/permission/controller";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { verifyOrg } from "@/lib/verifying/verifying";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const toggleSchema = z.object({
  roleId:       z.string().uuid(),
  permissionId: z.string().uuid(),
  isEnabled:    z.boolean(),
  outletId:     z.string().uuid().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  // ✅ check success flag, not truthiness
  const orgCheck = await verifyOrg(orgId);
  if (!orgCheck.success) {
    return NextResponse.json(
      { error: orgCheck.error },
      { status: orgCheck.status }
    );
  }

  const roleId   = req.nextUrl.searchParams.get("roleId");
  const outletId = req.nextUrl.searchParams.get("outletId") ?? undefined;

  if (!roleId) {
    return NextResponse.json(
      { error: "roleId is required" },
      { status: 400 }
    );
  }

  const result = await getRolePermissions(orgId, roleId, outletId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({
    organization: { id: orgCheck.data.id, name: orgCheck.data.name }, 
    ...result.data,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const orgCheck = await verifyOrg(orgId);
  if (!orgCheck.success) {
    return NextResponse.json(
      { error: orgCheck.error },
      { status: orgCheck.status }
    );
  }

  const body   = await req.json();
  const parsed = toggleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await togglePermission(
    orgId,
    parsed.data.roleId,
    parsed.data.permissionId,
    parsed.data.isEnabled,
    parsed.data.outletId
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({
    organization: { id: orgCheck.data.id, name: orgCheck.data.name }, 
    ...result.data,
  });
}