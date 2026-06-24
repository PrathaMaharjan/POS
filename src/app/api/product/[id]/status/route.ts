import { updateProductStatus } from "@/controller/product";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const schema = z.object({ isActive: z.boolean(),
  outletId: z.string().uuid().optional() }); 
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "inventory.products.update");
  if (permError) return permError;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
    const { outletId: requestedOutletId, isActive} = parsed.data;
  
  
    const resolved = await resolveOutletId(auth.payload, requestedOutletId);
    if ("error" in resolved) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status },
      );
    }
  
    const result = await updateProductStatus(resolved.outletId, id, isActive);
  
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
  
    return NextResponse.json(result.data);

}