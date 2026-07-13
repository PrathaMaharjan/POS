import { db } from "@/db";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { createPartialPayment } from "@/modules/pos/controller/payment";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const schema = z.object({
  method: z.enum(["cash", "card", "qr"]),
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "At least one item is required"),
  amountTendered: z.number().positive("Amount must be greater than 0"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  //   const permError = requiredPermission(auth.payload, "restaurant.bill_splits.create");
  //   if (permError) return permError;

  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId"),
  );
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createPartialPayment(
    resolved.outletId,
    id,
    auth.payload.userId,
    parsed.data,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: 201 });
}
// src/app/api/orders/[orderId]/partial-payment/route.ts — same file, add GET

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  //   const permError = requiredPermission(auth.payload, "restaurant.bill_splits.read");
  //   if (permError) return permError;

  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId"),
  );
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }

const order = await db.query.orders.findFirst({
  where: (o, { eq, and }) => and(eq(o.id, id), eq(o.outletId, resolved.outletId)),
  columns: { id: true, status: true, total: true, taxRate: true }, // ← taxRate added
  with: {
    items: {
      columns: { id: true, quantity: true, unitPrice: true },
      with: { product: { columns: { name: true } } },
    },
  },
});

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const paymentItemRows = await db.query.paymentItems.findMany({
    where: (pi, { inArray }) =>
      inArray(
        pi.orderItemId,
        order.items.map((i) => i.id),
      ),
  });

  const paidQtyMap = new Map<string, number>();
  for (const pi of paymentItemRows) {
    paidQtyMap.set(
      pi.orderItemId,
      (paidQtyMap.get(pi.orderItemId) ?? 0) + pi.quantity,
    );
  }

  const itemsWithPaymentStatus = order.items.map((item) => {
    const paidQty = paidQtyMap.get(item.id) ?? 0;
    return {
      orderItemId: item.id,
      unitPrice: Number(item.unitPrice),
      productName: item.product?.name,
      quantity: item.quantity,
      paidQty,
      unpaidQty: item.quantity - paidQty,
      fullyPaid: paidQty >= item.quantity,
    };
  });
  // console.log({
  //      orderId:  order.id,
  //   status:   order.status,
  //   total:    order.total,
  //   items:    itemsWithPaymentStatus,
  // })

 return NextResponse.json({
  orderId:  order.id,
  status:   order.status,
  total:    order.total,
  taxRate:  Number(order.taxRate ?? 0), // ← added
  items:    itemsWithPaymentStatus,
});
}
