import { chnagePassword } from "@/controller/password";
import { updateProfile } from "@/controller/profile";
import { requiredToken } from "@/lib/auth/requireAuth";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";


const schema = z.object({
  name:            z.string().min(2).optional(),
  email:           z.string().email().optional(),
  phone:           z.string().optional(),
  // password change — optional, only processed if both provided
  currentPassword: z.string().optional(),
  newPassword:     z.string().min(8).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateProfile(auth.payload.userId, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    message: "Profile updated successfully",
    user: result.data,
  });
}