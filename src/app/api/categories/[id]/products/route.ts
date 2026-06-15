import { getProductByCategory } from "@/controller/category";
import { requiredToken } from "@/lib/auth/requireAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;  

  const products = await getProductByCategory(auth.payload.activeOutletId!, id);

  return NextResponse.json({ products });
}