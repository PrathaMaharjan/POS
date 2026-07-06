import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { verifyOrgAndOutlet } from "@/lib/verifying/verifying";
import { updateOutlet } from "@/controller/outlets";
import { requiredToken } from "@/lib/auth/requireAuth";
import { db } from "@/db";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; outletId: string }> }
) {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const { orgId, outletId } = await params; // ← await + correct casing

  const outlet = await db.query.outlets.findFirst({
    where: (o, { eq, and }) =>
      and(eq(o.id, outletId), eq(o.organizationId, orgId)),
    columns: {
      id:                  true,
      skipKitchenWorkflow: true,
    },
  });

  if (!outlet) {
    return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
  }

  return NextResponse.json({
    outletId:            outlet.id,
    skipKitchenWorkflow: outlet.skipKitchenWorkflow,
  });
}

const updateSchema = z.object({
  skipKitchenWorkflow: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; outletId: string }> },
) {
  const { orgId, outletId } = await params;
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  const check = await verifyOrgAndOutlet(orgId, outletId);
  if (!check.success) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateOutlet(orgId, outletId, {
    skipKitchenWorkflow: parsed.data.skipKitchenWorkflow,
  });
  console.log(result);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({
    organization: { id: orgId, name: check.data.org.name },
    outlet: { id: outletId, name: check.data.outlet.name },
    skipKitchenWorkflow: parsed.data.skipKitchenWorkflow,
  });
}




