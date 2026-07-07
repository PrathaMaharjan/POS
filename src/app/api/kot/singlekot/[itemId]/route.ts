import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { updateKotItemStatus } from "@/modules/restaurant/controllers/kotController";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["preparing", "ready", "served"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "restaurant.kot.update");

  if (permError) return permError;

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateKotItemStatus(
    auth.payload.activeOutletId!,
    itemId,
    parsed.data.status,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}
