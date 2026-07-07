import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { requirePlan } from "@/lib/permissions/requirePlan";
import { listKotTickets } from "@/modules/restaurant/controllers/kotController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  // const planError = requirePlan(auth.payload, "standard");
  // if (planError) return planError;

  const permError = requiredPermission(auth.payload, "restaurant.kot.read");
  if (permError) return permError;

  const tickets = await listKotTickets(auth.payload.activeOutletId!);

  return NextResponse.json({ tickets });
}
