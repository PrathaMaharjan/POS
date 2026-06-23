import { db } from "@/db";
import { categories, outlets } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { tr } from "zod/v4/locales";
import { formatProduct } from "./product";

export async function getCategories(outletId: string) {
  return db.query.categories.findMany({
    where: (c, { eq, and }) =>
      and(eq(c.outletId, outletId), eq(c.isActive, true)),
    orderBy: (c, { asc }) => asc(c.sortOrder),
    columns: {
      id: true,
      name: true,
      isActive: true,
      outletId: true,
      sortOrder: true,
    },
  });
}
export async function getProductByCategory(
  outletId: string,
  categoryId: string,
) {
  const rows = await db.query.products.findMany({
    where: (p, { eq, and }) =>
      and(
        eq(p.outletId, outletId),
        eq(p.categoryId, categoryId),
        eq(p.isActive, true),
      ),
    with: {
      category: true,
    },
  });
  return rows.map(formatProduct);
}

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };
// helper — checks if a Postgres error is a unique constraint violation
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as any).code === "23505"
  );
}
//  ----------------------create Category -----------------------------------
export async function createCategory(
  outletId: string,
  input: { name: string; sortOrder?: number },
): Promise<ControllerResult<{ id: string; name: string; sortOrder: number }>> {
  try {
    const [category] = await db
      .insert(categories)
      .values({
        outletId,
        name: input.name,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning({
        id: categories.id,
        name: categories.name,
        sortOrder: categories.sortOrder,
      });

    return { success: true, data: category };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: "A category with this name already exists",
        status: 409,
      };
    }
    console.error("createCategory error:", error);
    return { success: false, error: "Failed to create category", status: 500 };
  }
}

// UPDATE — 1 query instead of 2-3
// ─────────────────────────────────────────────
export async function updateCategory(
  outletId: string,
  categoryId: string,
  input: { name?: string; sortOrder?: number },
): Promise<ControllerResult<{ id: string; name: string; sortOrder: number }>> {
  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateValues.name = input.name;
  if (input.sortOrder !== undefined) updateValues.sortOrder = input.sortOrder;

  try {
    const [updated] = await db
      .update(categories)
      .set(updateValues)
      .where(
        and(eq(categories.id, categoryId), eq(categories.outletId, outletId)),
      )
      .returning({
        id: categories.id,
        name: categories.name,
        sortOrder: categories.sortOrder,
      });

    // if no row was returned, the category doesn't exist at this outlet
    if (!updated) {
      return { success: false, error: "Category not found", status: 404 };
    }

    return { success: true, data: updated };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: "A category with this name already exists",
        status: 409,
      };
    }
    console.error("updateCategory error:", error);
    return { success: false, error: "Failed to update category", status: 500 };
  }
}

// --------soft delete we donot delete category we only change th estatus to like xa ki xaina type ---------------------------
export async function deleteCategory(
  outletId: string,
  categoryId: string
): Promise<ControllerResult<null>> {
  try {
    const [deleted] = await db
      .update(categories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(categories.id, categoryId), eq(categories.outletId, outletId)))
      .returning({ id: categories.id });

    if (!deleted) {
      return { success: false, error: "Category not found", status: 404 };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("deleteCategory error:", error);
    return { success: false, error: "Failed to delete category", status: 500 };
  }
}
// list only the active category 
export async function listCategories(outletId: string) {
  return db.query.categories.findMany({
    where: (c, { eq, and }) => and(eq(c.outletId, outletId), eq(c.isActive, true)),
    columns: { id: true, name: true, sortOrder: true },
    orderBy: (c, { asc }) => asc(c.sortOrder),
  });
}

// change the status 

export async function updateCategoryStatus(
  outletId: string,
  categoryId: string,
  isActive: boolean
): Promise<ControllerResult<{ id: string; isActive: boolean }>> {
  try {
    const [updated] = await db
      .update(categories)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(categories.id, categoryId), eq(categories.outletId, outletId)))
      .returning({ id: categories.id, isActive: categories.isActive });

    if (!updated) {
      return { success: false, error: "Category not found", status: 404 };
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("updateCategoryStatus error:", error);
    return { success: false, error: "Failed to update category status", status: 500 };
  }
}

