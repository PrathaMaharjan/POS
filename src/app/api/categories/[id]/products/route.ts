import { getProductByCategory } from "@/controller/category";
import { requiredToken } from "@/lib/auth/requireAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const permError = requirePermission(auth.payload, "inventory.products.read");
//   if (permError) return permError;

  const products = await getProductByCategory(auth.payload.activeOutletId!, params.id);

  return NextResponse.json({ products });
}