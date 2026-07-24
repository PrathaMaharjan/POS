import { listOrder } from "@/controller/orderController";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   const auth = await requiredToken(req);
//   if (!auth.ok) return auth.response;

//   const permError = requiredPermission(auth.payload, "pos.billing.read");
//   if (permError) return permError;
//   const resolved = await resolveOutletId(
//     auth.payload,
//     req.nextUrl.searchParams.get("outletId"),
//   );
//   if ("error" in resolved) {
//     return NextResponse.json(
//       { error: resolved.error },
//       { status: resolved.status },
//     );
//   }
//   const orders = await listOrder(resolved.outletId);

//   return NextResponse.json({ orders });
// }

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const date      = req.nextUrl.searchParams.get("date")      ?? undefined;
  const startDate = req.nextUrl.searchParams.get("startDate")  ?? undefined;
  const endDate   = req.nextUrl.searchParams.get("endDate")    ?? undefined;

  const result = await listOrder(auth.payload.activeOutletId as string, { date, startDate, endDate });

  return NextResponse.json({ orders: result });
}