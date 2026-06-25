import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { getOrgReports } from "@/controller/org/controller";

const schema = z.object({
  period:   z.enum(["7d", "30d", "90d"]).default("7d"),
  outletId: z.string().uuid().nullable().default(null),
});

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "pos.shift_reports.read");
  if (permError) return permError;

  const searchParams = req.nextUrl.searchParams;
  const parsed = schema.safeParse({
    period:   searchParams.get("period")   ?? "7d",
    outletId: searchParams.get("outletId") ?? null,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { period, outletId } = parsed.data;

  try {
    const data = await getOrgReports(
      auth.payload.organizationId,
      outletId,
      period
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("getOrgReports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization reports" },
      { status: 500 }
    );
  }
}