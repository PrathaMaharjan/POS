import { createOutlet, listOutlets } from "@/controller/outlets";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.outlets.read");
  if (permError) return permError;

  const data = await listOutlets(auth.payload.organizationId);
  return NextResponse.json({ outlets: data });
}

const createSchema = z.object({
  name:    z.string().min(1).max(255),
  address: z.string().optional(),
  phone:   z.string().max(30).optional(),
});


export async function POST(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.outlets.create");
  if (permError) return permError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createOutlet(auth.payload.organizationId, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 201 });
}