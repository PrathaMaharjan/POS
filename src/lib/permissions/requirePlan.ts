import { NextResponse } from "next/server";
import { PLAN_ORDER, type Plan } from "./planOrder";
import type { AccessTokenPayload } from "@/lib/auth/jwt"; // ← real type now

export function requirePlan(
  payload: AccessTokenPayload,
  minimumPlan: Plan,
): NextResponse | null {
  const currentPlan = payload.plan ?? "basic"; // fallback for safety
  const currentRank = PLAN_ORDER[currentPlan];
  const requiredRank = PLAN_ORDER[minimumPlan];

  if (currentRank < requiredRank) {
    return NextResponse.json(
      {
        error: `This feature requires the ${minimumPlan} plan`,
        currentPlan,
        requiredPlan: minimumPlan,
      },
      { status: 403 },
    );
  }

  return null;
}
