import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations,} from "@/db/schema";
import { getImageUrl } from "@/lib/cloudinary/storage";

export type ControllerResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string; status: number };

// ─────────────────────────────────────────────
// GET OWN ORGANIZATION DETAIL
// ─────────────────────────────────────────────
export async function getOwnOrganization(
  organizationId: string
): Promise<ControllerResult<{
  id:        string;
  name:      string;
  slug:      string;
  imageUrl:  string | null;
  isActive:  boolean;
  createdAt: Date;
  outlets:   {
    id:       string;
    name:     string;
    address:  string | null;
    phone:    string | null;
    isActive: boolean;
  }[];
}>> {
  const org = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.id, organizationId),
    columns: {
      id:            true,
      name:          true,
      slug:          true,
      imagePublicId: true,
      isActive:      true,
      createdAt:     true,
    },
  });

  if (!org) {
    return { success: false, error: "Organization not found", status: 404 };
  }

  const orgOutlets = await db.query.outlets.findMany({
    where: (o, { eq }) => eq(o.organizationId, organizationId),
    columns: {
      id:       true,
      name:     true,
      address:  true,
      phone:    true,
      isActive: true,
    },
  });

  return {
    success: true,
    data: {
      ...org,
      imageUrl: org.imagePublicId
        ? getImageUrl(org.imagePublicId, { width: 800, height: 400 })
        : null,
      outlets: orgOutlets,
    },
  };
}

// ─────────────────────────────────────────────
// UPDATE OWN ORGANIZATION DETAIL
// ─────────────────────────────────────────────
export async function updateOwnOrganization(
  organizationId: string,
  input: {
    name?:          string;
    imagePublicId?: string;
  }
): Promise<ControllerResult<{
  id:       string;
  name:     string;
  slug:     string;
  imageUrl: string | null;
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
      .where(eq(organizations.id, organizationId))
      .returning({
        id:            organizations.id,
        name:          organizations.name,
        slug:          organizations.slug,
        imagePublicId: organizations.imagePublicId,
      });

    if (!updated) {
      return { success: false, error: "Organization not found", status: 404 };
    }

    return {
      success: true,
      data: {
        id:       updated.id,
        name:     updated.name,
        slug:     updated.slug,
        imageUrl: updated.imagePublicId
          ? getImageUrl(updated.imagePublicId, { width: 800, height: 400 })
          : null,
      },
    };
  } catch (error) {
    console.error("updateOwnOrganization error:", error);
    return {
      success: false,
      error:  "Failed to update organization",
      status: 500,
    };
  }
}

// ─────────────────────────────────────────────
// REMOVE ORGANIZATION IMAGE
// ─────────────────────────────────────────────
export async function removeOrganizationImage(
  organizationId: string
): Promise<ControllerResult<null>> {
  try {
    const [updated] = await db
      .update(organizations)
      .set({ imagePublicId: null, updatedAt: new Date() })
      .where(eq(organizations.id, organizationId))
      .returning({ id: organizations.id });

    if (!updated) {
      return { success: false, error: "Organization not found", status: 404 };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("removeOrganizationImage error:", error);
    return {
      success: false,
      error:  "Failed to remove image",
      status: 500,
    };
  }
}