import { db } from "@/db";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export type OrgData = {
  id:       string;
  name:     string;
  slug:     string;
  isActive: boolean;
};

export type OutletData = {
  id:       string;
  name:     string;
  isActive: boolean;
};

type VerifySuccess<T> = { success: true;  data: T };
type VerifyFailure    = { success: false; error: string; status: number };
type VerifyResult<T>  = VerifySuccess<T> | VerifyFailure;

// ─────────────────────────────────────────────
// VERIFY ORGANIZATION
// ─────────────────────────────────────────────
export async function verifyOrg(
  orgId: string
): Promise<VerifyResult<OrgData>> {
  const org = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.id, orgId),
    columns: {
      id:       true,
      name:     true,
      slug:     true,
      isActive: true,
    },
  });

  if (!org) {
    return {
      success: false,
      error:   "Organization not found",
      status:  404,
    };
  }

  return {
    success: true,
    data: {
      id:       org.id,
      name:     org.name,
      slug:     org.slug,
      isActive: org.isActive,
    },
  };
}

// ─────────────────────────────────────────────
// VERIFY OUTLET BELONGS TO ORG
// ─────────────────────────────────────────────
export async function verifyOutlet(
  orgId:    string,
  outletId: string
): Promise<VerifyResult<OutletData>> {
  const outlet = await db.query.outlets.findFirst({
    where: (o, { eq, and }) =>
      and(
        eq(o.id,             outletId),
        eq(o.organizationId, orgId)
      ),
    columns: {
      id:       true,
      name:     true,
      isActive: true,
    },
  });

  if (!outlet) {
    return {
      success: false,
      error:   "Outlet not found or does not belong to this organization",
      status:  404,
    };
  }

  return {
    success: true,
    data: {
      id:       outlet.id,
      name:     outlet.name,
      isActive: outlet.isActive,
    },
  };
}

// ─────────────────────────────────────────────
// VERIFY BOTH ORG AND OUTLET IN PARALLEL
// ─────────────────────────────────────────────
export async function verifyOrgAndOutlet(
  orgId:    string,
  outletId: string
): Promise<VerifyResult<{ org: OrgData; outlet: OutletData }>> {
  const [org, outlet] = await Promise.all([
    db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.id, orgId),
      columns: {
        id:       true,
        name:     true,
        slug:     true,
        isActive: true,
      },
    }),
    db.query.outlets.findFirst({
      where: (o, { eq, and }) =>
        and(
          eq(o.id,             outletId),
          eq(o.organizationId, orgId)
        ),
      columns: {
        id:       true,
        name:     true,
        isActive: true,
      },
    }),
  ]);

  if (!org) {
    return {
      success: false,
      error:   "Organization not found",
      status:  404,
    };
  }

  if (!outlet) {
    return {
      success: false,
      error:   "Outlet not found or does not belong to this organization",
      status:  404,
    };
  }

  return {
    success: true,
    data: {
      org: {
        id:       org.id,
        name:     org.name,
        slug:     org.slug,
        isActive: org.isActive,
      },
      outlet: {
        id:       outlet.id,
        name:     outlet.name,
        isActive: outlet.isActive,
      },
    },
  };
}