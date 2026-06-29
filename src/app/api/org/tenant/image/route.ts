import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { removeOrganizationImage } from "@/controller/org/tenant/controller";

export async function DELETE(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.outlets.update");
  if (permError) return permError;

  const result = await removeOrganizationImage(auth.payload.organizationId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true });
}