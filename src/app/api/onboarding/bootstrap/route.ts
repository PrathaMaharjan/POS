import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bootstrapTenant } from "@/db/onboarding";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Missing name or slug" }, { status: 400 });
  }

  try {
    const tenant = await bootstrapTenant({
      name,
      slug,
      ownerUserId: session.user.id,
    });
    return NextResponse.json(tenant, { status: 201 });
  } catch (err: any) {
    console.error("Bootstrap error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to bootstrap tenant" },
      { status: 500 }
    );
  }
}