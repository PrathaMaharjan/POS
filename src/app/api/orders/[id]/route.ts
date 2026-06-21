import { getOrderById, getOrderByTable, cancelOrder } from "@/controller/orderController";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";

// export async function Get(req:NextRequest,{params}:{params :{id : string}}){
//       const auth = await requiredToken(req);
//   if (!auth.ok) return auth.response;

// //   const permError = requiredPermission(auth.payload, "pos.billing.read");
// //   if (permError) return permError;
// console.log(params.id)

//   const order = await getOrderById(auth.payload.activeOutletId!, params.id);

//   if (!order) {
//     return NextResponse.json({ error: "Order not found" }, { status: 404 });
//   }

//   return NextResponse.json({ order });
// }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;
  const {id} = await params

  const permError = requiredPermission(auth.payload, "restaurant.tables.read");
  if (permError) return permError;
  const result = await getOrderByTable(auth.payload.activeOutletId!, id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const permError = requiredPermission(auth.payload, "pos.billing.update");
  if (permError) return permError;

  const result = await cancelOrder(auth.payload.activeOutletId!, id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ success: true, order: result.data });
}

