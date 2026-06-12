// app/api/onboarding/location/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createFirstLocation } from "@/db/onboarding";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tenantId, name, address, phone } = body;

  if (!tenantId || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const location = await createFirstLocation({
    tenantId,
    name,
    address,
    phone,
  });
  return NextResponse.json(location, { status: 201 });
}
