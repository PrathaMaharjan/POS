import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import {
  getKotTicketById,
  updateKotStatus,
} from "@/modules/restaurant/controllers/kotController";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

    const permError = requiredPermission(auth.payload, "restaurant.kot.read");
    if (permError) return permError;

  const ticket = await getKotTicketById(auth.payload.activeOutletId!, id);

  if (!ticket) {
    return NextResponse.json(
      { error: "KOT ticket not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ticket });
}

// update stataus
const schema = z.object({
  status: z.enum(["pending", "preparing", "ready", "served"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

    const permError = requiredPermission(auth.payload, "restaurant.kot.update");
    if (permError) return permError;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateKotStatus(
    auth.payload.activeOutletId!,
    id,
    parsed.data.status,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ ticket: result.data });
}
