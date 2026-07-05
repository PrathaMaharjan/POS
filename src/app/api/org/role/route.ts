import { db } from "@/db";
import { requiredToken } from "@/lib/auth/requireAuth";
// import { requiredToken } from "@/lib/auth/requireToken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const { organizationId } = auth.payload;

  // ── fetch all roles ──
  // roles are global (seeded once, shared across all orgs)
  // every org uses the same base roles assigned via userOutletRoles
  const allRoles = await db.query.roles.findMany({
    columns: {
      id:          true,
      name:        true,
      description: true,
    },
    orderBy: (r, { asc }) => [asc(r.name)],
  });

  return NextResponse.json({
    organizationId,
    roles: allRoles,
  });
}