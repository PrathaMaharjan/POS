import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { updateSuperAdminProfile } from "@/controller/superadmin/controller";

const updateSchema = z.object({
  name:            z.string().min(2).max(255).optional(),
  email:           z.string().email().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword:     z.string().min(8).optional(),
}).refine(
  (data) => {
    // if changing email or password, currentPassword is required
    if ((data.email || data.newPassword) && !data.currentPassword) {
      return false;
    }
    return true;
  },
  { message: "Current password is required to change email or password" }
);

export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const body   = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateSuperAdminProfile(
    auth.payload.superAdminId,
    parsed.data
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ superAdmin: result.data });
}