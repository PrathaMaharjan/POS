import { getTables } from "@/controller/tableController";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const permError = requiredPermission(auth.payload, "restaurant.tables.read");
//   if (permError) return permError;

  const tables = await getTables(auth.payload.activeOutletId!);

  return NextResponse.json({ tables });
}