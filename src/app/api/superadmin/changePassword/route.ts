import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { changeSuperAdminPassword } from "@/controller/superadmin/controller";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
});

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const body   = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await changeSuperAdminPassword(
    auth.payload.superAdminId,
    parsed.data
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true });
}