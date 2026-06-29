import { db } from "@/db";
import {
  organizations,
  outlets,
  userOutletRoles,
  userOutlets,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { getImageUrl } from "@/lib/cloudinary/storage";
import { transporter } from "@/lib/email/mailer";
import { slugify } from "@/utils/slugify";
import { eq, sql } from "drizzle-orm";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

//------------------------- HELPER — format organization--------------------------
function formatOrg(org: {
  id: string;
  name: string;
  slug: string;
  imagePublicId: string | null;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    ...org,
    imageUrl: org.imagePublicId
      ? getImageUrl(org.imagePublicId, { width: 800, height: 400 })
      : null,
  };
}
// ---------------------------------- function to send mail ----------------------------------------------------------
async function sendWelcomeEmail(
  email: string,
  name: string,
  password: string,
  orgName: string,
  slug: string,
) {
  await transporter.sendMail({
    from: `"POS System" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Welcome to ${orgName} — Your POS Account is Ready`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Welcome to ${orgName}!</h2>
        <p>Hi ${name},</p>
        <p>Your POS account has been created by the admin team. Here are your login details:</p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><strong>Login URL:</strong> <a href="${process.env.APP_URL}/login">${process.env.APP_URL}/login</a></p>
          <p><strong>Your slug:</strong> ${slug}</p>
        </div>
        <p style="color: #ef4444;"><strong>⚠️ Please change your password after first login.</strong></p>
        <p>— The POS Team</p>
      </div>
    `,
  });
}
// -------------------------- LIST ALL ORGANIZATIONS===========================
export async function listOrganizations() {
  const orgs = await db.query.organizations.findMany({
    columns: {
      id: true,
      name: true,
      slug: true,
      imagePublicId: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: (o, { desc }) => desc(o.createdAt),
  });
  // get outlet + staff counts per org in parallel
  const [outletCounts, staffCounts] = await Promise.all([
    db
      .select({
        organizationId: outlets.organizationId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(outlets)
      .groupBy(outlets.organizationId),

    db
      .select({
        organizationId: users.organizationId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(users)
      .where(eq(users.isActive, true))
      .groupBy(users.organizationId),
  ]);

  const outletCountMap = new Map(
    outletCounts.map((r) => [r.organizationId, r.count]),
  );
  const staffCountMap = new Map(
    staffCounts.map((r) => [r.organizationId, r.count]),
  );

  return orgs.map((org) => ({
    ...formatOrg(org),
    totalOutlets: Number(outletCountMap.get(org.id) ?? 0),
    totalStaff: Number(staffCountMap.get(org.id) ?? 0),
  }));
}

// get single oragnization
export async function getOrganization(
  orgId: string,
): Promise<ControllerResult<any>> {
  const org = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.id, orgId),
    columns: {
      id: true,
      name: true,
      slug: true,
      imagePublicId: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!org) {
    return { success: false, error: "Organization not found", status: 404 };
  }

  // get outlets + owner in parallel
  const [orgOutlets, owner] = await Promise.all([
    db.query.outlets.findMany({
      where: (o, { eq }) => eq(o.organizationId, orgId),
      columns: {
        id: true,
        name: true,
        address: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    }),

    db.query.users.findFirst({
      where: (u, { eq, and }) =>
        and(eq(u.organizationId, orgId), eq(u.isOwner, true)),
      columns: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    success: true,
    data: {
      ...formatOrg(org),
      owner: owner ?? null,
      outlets: orgOutlets,
    },
  };
}
// --------------------------delete organiztion--------------------------------------------
export async function deleteOrganization(
  orgId: string,
): Promise<ControllerResult<null>> {
  const existing = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.id, orgId),
    columns: { id: true, name: true },
  });

  if (!existing) {
    return { success: false, error: "Organization not found", status: 404 };
  }

  try {
    await db.delete(organizations).where(eq(organizations.id, orgId));

    return { success: true, data: null };
  } catch (error) {
    console.error("deleteOrganization error:", error);
    return {
      success: false,
      error: "Failed to delete organization",
      status: 500,
    };
  }
}

// -------------------------------- suspend organization-----------------------------------
export async function suspendOrganization(
  orgId: string,
): Promise<ControllerResult<null>> {
  const existing = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.id, orgId),
    columns: { id: true, isActive: true },
  });

  if (!existing) {
    return { success: false, error: "Organization not found", status: 404 };
  }

  if (!existing.isActive) {
    return {
      success: false,
      error: "Organization is already suspended",
      status: 400,
    };
  }
  // suspend org + all its outlets in parallel
  await Promise.all([
    db
      .update(organizations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(organizations.id, orgId)),

    db
      .update(outlets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(outlets.organizationId, orgId)),
  ]);

  return { success: true, data: null };
}

// ---------------------------- active status --------------------------------------------
export async function activateOrganization(
  orgId: string,
): Promise<ControllerResult<null>> {
  const existing = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.id, orgId),
    columns: { id: true, isActive: true },
  });

  if (!existing) {
    return { success: false, error: "Organization not found", status: 404 };
  }
  if (existing.isActive) {
    return {
      success: false,
      error: "Organization is already active",
      status: 400,
    };
  }
  await Promise.all([
    db
      .update(organizations)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(organizations.id, orgId)),

    db
      .update(outlets)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(outlets.organizationId, orgId)),
  ]);

  return { success: true, data: null };
}

export async function createOrganization(input: {
  name: string;
  slug?: string;
  imagePublicId?: string;
  outletName?: string;
  address?: string;
  phone?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}): Promise<
  ControllerResult<{
    organizationId: string;
    outletId: string;
    ownerId: string;
    slug: string;
    imageUrl: string | null;
  }>
> {
  const {
    name,
    imagePublicId,
    outletName = "Main Branch",
    address,
    phone,
    ownerName,
    ownerEmail,
    ownerPassword,
  } = input;

  // ── auto-generate slug ──
  const slug = input.slug ? slugify(input.slug) : slugify(name);

  if (!slug) {
    return {
      success: false,
      error: "Could not generate a valid slug from the organization name",
      status: 400,
    };
  }

  // ── 1. check slug not taken ──
  const existingSlug = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.slug, slug),
    columns: { id: true },
  });

  if (existingSlug) {
    return {
      success: false,
      error: `Slug "${slug}" is already taken`,
      status: 409,
    };
  }

  // ── 2. check owner email not taken ──
  const existingEmail = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, ownerEmail),
    columns: { id: true },
  });

  if (existingEmail) {
    return {
      success: false,
      error: `Email "${ownerEmail}" is already in use`,
      status: 409,
    };
  }

  // ── 3. find Owner role ──
  const ownerRole = await db.query.roles.findFirst({
    where: (r, { eq, isNull, and }) =>
      and(eq(r.name, "Owner"), isNull(r.organizationId)),
    columns: { id: true },
  });

  if (!ownerRole) {
    return {
      success: false,
      error: "Owner role not found — run db:seed first",
      status: 500,
    };
  }

  // ── 4. hash password ──
  const passwordHash = await hashPassword(ownerPassword);

  try {
    // ── 5. create organization ──
    const [org] = await db
      .insert(organizations)
      .values({
        name,
        slug,
        imagePublicId: imagePublicId ?? null,
      })
      .returning({
        id: organizations.id,
        slug: organizations.slug,
        imagePublicId: organizations.imagePublicId,
      });

    // ── 6. create default outlet ──
    const [outlet] = await db
      .insert(outlets)
      .values({
        organizationId: org.id,
        name: outletName,
        address: address ?? null,
        phone: phone ?? null,
      })
      .returning({ id: outlets.id });

    // ── 7. create Owner user ──
    const [owner] = await db
      .insert(users)
      .values({
        organizationId: org.id,
        name: ownerName,
        email: ownerEmail,
        passwordHash,
        isOwner: true,
        emailVerified: true,
      })
      .returning({ id: users.id });

    // ── 8. link owner to outlet + assign Owner role ──
    await Promise.all([
      db.insert(userOutlets).values({
        userId: owner.id,
        outletId: outlet.id,
      }),
      db.insert(userOutletRoles).values({
        userId: owner.id,
        outletId: outlet.id,
        roleId: ownerRole.id,
      }),
    ]);

    // ── 9. send welcome email (non-blocking) ──
    sendWelcomeEmail(ownerEmail, ownerName, ownerPassword, name, slug).catch(
      (err) => console.error("Welcome email failed:", err),
    );

    return {
      success: true,
      data: {
        organizationId: org.id,
        outletId: outlet.id,
        ownerId: owner.id,
        slug: org.slug,
        imageUrl: org.imagePublicId
          ? getImageUrl(org.imagePublicId, { width: 800, height: 400 })
          : null,
      },
    };
  } catch (error) {
    console.error("createOrganization error:", error);
    return {
      success: false,
      error: "Failed to create organization",
      status: 500,
    };
  }
}

// ------------------------------- update ----------------------------------------------
export async function updateOrganization(
  orgId: string,
  input: {
    name?:          string;
    imagePublicId?: string;
  }
): Promise<ControllerResult<{
  id:       string;
  name:     string;
  imageUrl: string | null; // ← add
}>> {
  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name          !== undefined) updateValues.name          = input.name;
  if (input.imagePublicId !== undefined) updateValues.imagePublicId = input.imagePublicId;

  if (Object.keys(updateValues).length === 1) {
    return {
      success: false,
      error:  "Provide at least one field to update",
      status: 400,
    };
  }

  try {
    const [updated] = await db
      .update(organizations)
      .set(updateValues)
      .where(eq(organizations.id, orgId))
      .returning({
        id:            organizations.id,
        name:          organizations.name,
        imagePublicId: organizations.imagePublicId, // ← add
      });

    if (!updated) {
      return { success: false, error: "Organization not found", status: 404 };
    }

    return {
      success: true,
      data: {
        id:       updated.id,
        name:     updated.name,
        imageUrl: updated.imagePublicId  // ← add
          ? getImageUrl(updated.imagePublicId, { width: 800, height: 400 })
          : null,
      },
    };
  } catch (error) {
    console.error("updateOrganization error:", error);
    return {
      success: false,
      error:  "Failed to update organization",
      status: 500,
    };
  }
}