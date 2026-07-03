import { db } from "@/db";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  // ── verify org exists ──
  const org = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.id, orgId),
    columns: { id: true, name: true },
  });

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  // ── fetch all roles ──
  // roles are global (seeded once) and shared across all orgs
  // every org uses the same base roles assigned via userOutletRoles
  const allRoles = await db.query.roles.findMany({
    columns: {
      id:   true,
      name: true,
    },
    orderBy: (r, { asc }) => [asc(r.name)],
  });

  return NextResponse.json({
    organization: { id: org.id, name: org.name },
    roles:        allRoles,
  });
}