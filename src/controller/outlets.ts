import { db } from "@/db";
import { outlets } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as any).code === "23505"
  );
}

function isFKViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as any).code === "23503"
  );
}
// -------------------GET OUTETS LIST -------------------------------
export async function listOutlets(organizationId: string) {
  const rows = await db.query.outlets.findMany({
    where: (o, { eq }) => eq(o.organizationId, organizationId),
    columns: {
      id:                   true,
      name:                 true,
      address:              true,
      phone:                true,
      isActive:             true,
      skipKitchenWorkflow:  true, 
      createdAt:            true,
    },
  });

  return rows;
}

// ------------------------- create outlets --------------------------------
export async function createOutlet(
  organizationId: string,
  input: { name: string; address?: string; phone?: string },
): Promise<ControllerResult<{ id: string; name: string }>> {
  try {
    const [outlet] = await db
      .insert(outlets)
      .values({
        organizationId,
        name: input.name,
        address: input.address ?? null,
        phone: input.phone ?? null,
      })
      .returning({ id: outlets.id, name: outlets.name });

    return { success: true, data: outlet };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: "An outlet with this name already exists",
        status: 409,
      };
    }
    console.error("createOutlet error:", error);
    return { success: false, error: "Failed to create outlet", status: 500 };
  }
}
// -----------------------update outlers -----------------------------------

export async function updateOutlet(
  organizationId: string,
  outletId:       string,
  input: {
    name?:                string;
    address?:             string;
    phone?:               string;
    skipKitchenWorkflow?: boolean; // ← add this
  }
): Promise<ControllerResult<{ id: string; name: string }>> {

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name                !== undefined) updateValues.name                = input.name;
  if (input.address             !== undefined) updateValues.address             = input.address;
  if (input.phone               !== undefined) updateValues.phone               = input.phone;
  if (input.skipKitchenWorkflow !== undefined) updateValues.skipKitchenWorkflow = input.skipKitchenWorkflow; // ← add this

  if (Object.keys(updateValues).length === 1) {
    return {
      success: false,
      error:  "Provide at least one field to update",
      status: 400,
    };
  }

  try {
    const [updated] = await db
      .update(outlets)
      .set(updateValues)
      .where(
        and(eq(outlets.id, outletId), eq(outlets.organizationId, organizationId))
      )
      .returning({ id: outlets.id, name: outlets.name });

    if (!updated) {
      return { success: false, error: "Outlet not found", status: 404 };
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("updateOutlet error:", error);
    return { success: false, error: "Failed to update outlet", status: 500 };
  }
}
// ------------------- delete outlets ----------------------------------------
export async function deleteOutlet(
  organizationId: string,
  outletId: string,
): Promise<ControllerResult<null>> {
  // count total outlets and verify this one exists — in parallel
  const [totalResult, existing] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(outlets)
      .where(eq(outlets.organizationId, organizationId)),

    db.query.outlets.findFirst({
      where: (o, { eq, and }) =>
        and(eq(o.id, outletId), eq(o.organizationId, organizationId)),
      columns: { id: true },
    }),
  ]);

  if (!existing) {
    return { success: false, error: "Outlet not found", status: 404 };
  }

  if (Number(totalResult[0]?.count ?? 0) <= 1) {
    return {
      success: false,
      error: "Cannot delete the last outlet of an organization",
      status: 400,
    };
  }

  try {
    await db
      .delete(outlets)
      .where(
        and(
          eq(outlets.id, outletId),
          eq(outlets.organizationId, organizationId),
        ),
      );

    return { success: true, data: null };
  } catch (error) {
    if (isFKViolation(error)) {
      return {
        success: false,
        error: "Cannot delete outlet — it still has active references",
        status: 409,
      };
    }
    console.error("deleteOutlet error:", error);
    return { success: false, error: "Failed to delete outlet", status: 500 };
  }
}

//------------------------------- change status --------------------------------------
export async function updateOutletStatus(
  organizationId: string,
  outletId: string,
  isActive: boolean,
): Promise<ControllerResult<{ id: string; isActive: boolean }>> {
  try {
    const [updated] = await db
      .update(outlets)
      .set({ isActive, updatedAt: new Date() })
      .where(
        and(
          eq(outlets.id, outletId),
          eq(outlets.organizationId, organizationId),
        ),
      )
      .returning({ id: outlets.id, isActive: outlets.isActive });

    if (!updated) {
      return { success: false, error: "Outlet not found", status: 404 };
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("updateOutletStatus error:", error);
    return {
      success: false,
      error: "Failed to update outlet status",
      status: 500,
    };
  }
}
