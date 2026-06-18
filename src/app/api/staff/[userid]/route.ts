import { getStaffById, removeStaff, updateStaffRole } from "@/controller/staff";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const schema = z.object({
  role: z.enum(["Cashier", "Waiter", "Kitchen Crew"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userid: string }> },
) {
  const { userid } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.users.update");
  if (permError) return permError;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateStaffRole(
    auth.payload.activeOutletId!,
    userid,
    parsed.data.role,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
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

  const result = await removeStaff(auth.payload.activeOutletId!, userid);
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
