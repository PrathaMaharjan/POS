// app/api/payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import {
  getPaymentHistory,
  getFilteredPaymentHistory,
  PaymentMethod,
} from "@/modules/pos/controller/payment";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;
  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId"),
  );
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }
  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const dateStr = searchParams.get("date") ?? undefined;
  const methodStr = searchParams.get("method") ?? undefined;

  try {
    let result;

    if (methodStr && !dateStr) {
      result = await getFilteredPaymentHistory(
        resolved.outletId,
        limit,
        offset,
        methodStr as PaymentMethod,
      );
    } else {
      result = await getPaymentHistory(
        resolved.outletId,
        limit,
        offset,
        dateStr,
      );

      // if method is also provided, filter in-memory
      if (methodStr) {
        result.payments = result.payments.filter((p) => p.method === methodStr);
        result.total = result.payments.length;
      }
    }

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
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 },
    );
  }
}
