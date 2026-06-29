import { createOrganization, listOrganizations } from "@/controller/superadmin/oragnization/controller";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const data = await listOrganizations();
    return NextResponse.json({ organizations: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

const createSchema = z.object({
  // org
  name:          z.string().min(2).max(255),
  slug:          z.string().min(2).max(100).optional(),
  imagePublicId: z.string().optional(),
  // outlet
  outletName:    z.string().optional(),
  address:       z.string().optional(),
  phone:         z.string().optional(),
  // owner
  ownerName:     z.string().min(2),
  ownerEmail:    z.string().email(),
  ownerPassword: z.string().min(8),
});


export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const body   = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createOrganization(parsed.data)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data, { status: 201 });
}