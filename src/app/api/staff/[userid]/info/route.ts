import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requiredToken } from "@/lib/auth/requireAuth";
// import { requirePermission } from "@/lib/permissions/requirePermission";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { updateStaffInfo } from "@/controller/staff";

const schema = z.object({
  name:     z.string().min(2).optional(),
  phone:    z.string().optional(),
  email:    z.string().email().optional(),
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

  // remove outletId from the update payload
  const { outletId, ...updateFields } = parsed.data;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one field to update" },
      { status: 400 }
    );
  }

  // Owner → can pass outletId, Manager → uses JWT
  const resolvedOutletId = auth.payload.role === "Owner"
    ? (outletId ?? auth.payload.activeOutletId!)
    : auth.payload.activeOutletId!;

  if (!resolvedOutletId) {
    return NextResponse.json({ error: "No outlet found" }, { status: 400 });
  }

  const result = await updateStaffInfo(resolvedOutletId, userid, updateFields);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}