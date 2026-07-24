import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { createDineInOrder } from "@/controller/orderController";
// import { requirePermission } from "@/lib/permissions/requirePermission";
// import { createDineInOrder } from "@/modules/pos/controllers/orderController";

// const schema = z.object({
//   tableId: z.string().uuid(),
//   items: z
//     .array(
//       z.object({
//         productId: z.string().uuid(),
//         quantity: z.number().int().positive(),
//         notes: z.string().optional(),
//       })
//     )
//     .min(1),
// });

const schema = z.object({
  tableId: z.string().uuid(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().positive(),
        notes: z.string().optional(),
      })
    )
    .min(1),
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

  const result = await createDineInOrder(auth.payload.activeOutletId!, auth.payload.userId, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 201 });
}