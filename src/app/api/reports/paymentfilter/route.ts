import { NextRequest, NextResponse } from "next/server";
import { requiredToken } from "@/lib/auth/requireAuth";
import { getFilteredPaymentHistory, PaymentMethod } from "@/modules/pos/controller/payment";

const VALID_METHODS: PaymentMethod[] = ["cash", "card", "qr"];

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

//   const permError = requirePermission(auth.payload, "pos.payments.read");
//   if (permError) return permError;

  const searchParams = req.nextUrl.searchParams;

  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page   = Math.max(parseInt(searchParams.get("page")  ?? "1"),  1);
  const offset = (page - 1) * limit;

  const methodParam = searchParams.get("method") as PaymentMethod | null;

  if (methodParam && !VALID_METHODS.includes(methodParam)) {
    return NextResponse.json(
      { error: "method must be cash, card, or qr" },
      { status: 400 }
    );
  }

  try {
    const result = await getFilteredPaymentHistory(
      auth.payload.activeOutletId!,
      limit,
      offset,
      methodParam ?? undefined
    );

    return NextResponse.json({
      ...result,
      pagination: {
        page,
        limit,
        total:      result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      activeMethod: methodParam ?? null,
    });
  } catch (error) {
    console.error("getFilteredPaymentHistory error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}