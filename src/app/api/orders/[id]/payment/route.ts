import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import {
  createPayment,
  listPaymentsForOrder,
} from "@/modules/pos/controller/payment";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const schema = z.object({
  amount: z.number().positive(),
  method: z.enum(["cash", "card", "qr"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const permError = requiredPermission(auth.payload, "pos.payments.create");
  if (permError) return permError;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createPayment(
    auth.payload.activeOutletId!,
    auth.payload.userId,
    id,
    parsed.data.amount,
    parsed.data.method,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: 201 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
    const permError = requiredPermission(auth.payload, "pos.payments.read");
    if (permError) return permError;

  const result = await listPaymentsForOrder(auth.payload.activeOutletId!, id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}
