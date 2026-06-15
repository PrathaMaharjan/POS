import { listOrder } from "@/controller/orderController";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  //   const permError = requiredPermission(auth.payload, "pos.billing.read");
  //   if (permError) return permError;
  const orders = await listOrder(auth.payload.activeOutletId!);

  return NextResponse.json({ orders });
}
