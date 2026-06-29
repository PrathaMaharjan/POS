import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { suspendOrganization } from "@/controller/superadmin/oragnization/controller";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth   = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const result = await suspendOrganization(id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true });
}