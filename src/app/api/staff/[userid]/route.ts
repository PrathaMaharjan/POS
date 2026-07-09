import { getStaffById, removeStaff, updateStaffRole } from "@/controller/staff";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const schema = z.object({
  role: z.enum(["Manager", "Cashier", "Waiter", "Kitchen Crew"]),
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

  const isOwner = auth.payload.role === "Owner";

  // validate role — Manager cannot assign Manager role
  const allowedRoles = isOwner
    ? (["Manager", "Cashier", "Waiter", "Kitchen Crew"] as const)
    : (["Cashier", "Waiter", "Kitchen Crew"] as const);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // block Manager from assigning Manager role
  if (!isOwner && parsed.data.role === "Manager") {
    return NextResponse.json(
      { error: "Managers cannot assign the Manager role" },
      { status: 403 }
    );
  }

  const { role, outletId } = parsed.data;

  // Owner → uses outletId from body, Manager → uses JWT
  const resolvedOutletId = isOwner
    ? (outletId ?? auth.payload.activeOutletId!)
    : auth.payload.activeOutletId!;

  if (!resolvedOutletId) {
    return NextResponse.json({ error: "No outlet found" }, { status: 400 });
  }

  const result = await updateStaffRole(resolvedOutletId, userid, role);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userid: string }> },
) {
  const { userid } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.users.delete");
  if (permError) return permError;

  // Owner → can pass ?outletId= in query params
  // Manager → uses their activeOutletId from JWT
  const isOwner = auth.payload.role === "Owner";

  const outletId = isOwner
    ? (req.nextUrl.searchParams.get("outletId") ?? auth.payload.activeOutletId!)
    : auth.payload.activeOutletId!;

  if (!outletId) {
    return NextResponse.json({ error: "No outlet found" }, { status: 400 });
  }
  const result = await removeStaff(outletId, userid);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ success: true });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userid: string }> },
) {
  const { userid } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.users.read");
  if (permError) return permError;

  const staff = await getStaffById(auth.payload.activeOutletId!, userid);

  if (!staff) {
    return NextResponse.json(
      { error: "Staff member not found at this outlet" },
      { status: 404 },
    );
  }

  return NextResponse.json({ staff });
}
