

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { activateStaff, deactivateStaff } from "@/controller/staff";

const schema = z.object({
  isActive: z.boolean(),
  outletId: z.string().uuid().optional(), // ← Owner passes this
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userid: string }> }
) {
  const { userid } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.users.update");
  if (permError) return permError;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { isActive, outletId } = parsed.data;

  // Owner → uses outletId from body, Manager → uses JWT
  const resolvedOutletId = auth.payload.role === "Owner"
    ? (outletId ?? auth.payload.activeOutletId!)
    : auth.payload.activeOutletId!;

  if (!resolvedOutletId) {
    return NextResponse.json({ error: "No outlet found" }, { status: 400 });
  }

  const result = isActive
    ? await activateStaff(resolvedOutletId, userid)
    : await deactivateStaff(resolvedOutletId, userid);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}