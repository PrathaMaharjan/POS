import { getCategories } from "@/controller/category";
import { requiredToken } from "@/lib/auth/requireAuth";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const categories = await getCategories(auth.payload.activeOutletId!);

  return NextResponse.json({ categories });
}