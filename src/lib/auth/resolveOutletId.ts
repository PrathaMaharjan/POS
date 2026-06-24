import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { outlets } from "@/db/schema";

interface TokenPayload {
  role: string | null;
  activeOutletId: string | null;
  organizationId: string;
}

type ResolveResult =
  | { outletId: string }
  | { error: string; status: number };

export async function resolveOutletId(
  payload: TokenPayload,
  requestedOutletId?: string | null
): Promise<ResolveResult> {
  const isOwner = payload.role === "Owner";

  // ── pick the right outletId ──
  const outletId = isOwner
    ? (requestedOutletId ?? payload.activeOutletId)
    : payload.activeOutletId;

  if (!outletId) {
    return { error: "No active outlet found", status: 400 };
  }

  // ── security: if Owner passed a specific outletId,
  //    verify it actually belongs to their organization ──
  if (isOwner && requestedOutletId) {
    const outlet = await db.query.outlets.findFirst({
      where: (o, { eq, and }) =>
        and(
          eq(o.id, outletId),
          eq(o.organizationId, payload.organizationId)
        ),
      columns: { id: true },
    });

    if (!outlet) {
      return {
        error: "Outlet not found or does not belong to your organization",
        status: 403,
      };
    }
  }

  return { outletId };
}