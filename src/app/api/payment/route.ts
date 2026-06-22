import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { getPaymentHistory } from "@/modules/pos/controller/payment";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const permError = requirePermission(auth.payload, "pos.payments.read");
//   if (permError) return permError;

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const dateStr = searchParams.get("date") ?? undefined;

  try {
    const result = await getPaymentHistory(
      auth.payload.activeOutletId!,
      limit,
      offset,
      dateStr
    );

    return NextResponse.json({
      ...result,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error("getPaymentHistory error:", error);
    return NextResponse.json({ error: "Failed to fetch payment history" }, { status: 500 });
  }
}