import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requiredToken } from "@/lib/auth/requireAuth";
// import { requirePermission } from "@/lib/permissions/requirePermission";
import { placeAndPayTakeawayOrder } from "@/controller/orderController";
import { requiredPermission } from "@/lib/permissions/requirePermission";

const schema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1),
      notes: z.string().optional(),
    })
  ).min(1, "At least one item is required"),
  payment: z.object({
    method: z.enum(["cash", "card", "qr"]),
    amountTendered: z.number().positive("Amount must be greater than 0"),
  }),
});

export async function POST(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "pos.billing.create");
  if (permError) return permError;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await placeAndPayTakeawayOrder(
    auth.payload.activeOutletId!,
    auth.payload.userId,
    parsed.data
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 201 });
}