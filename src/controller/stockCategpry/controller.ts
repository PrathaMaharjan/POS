import { db } from "@/db";
import { stockCategories, stockItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };
// ------------------------getAll stock --------------------------------------
export async function listStockCategories(
  outletId: string,
): Promise<ControllerResult<(typeof stockCategories.$inferSelect)[]>> {
  const rows = await db.query.stockCategories.findMany({
    where: (c, { eq, and }) =>
      and(eq(c.outletId, outletId), eq(c.isActive, true)),
    orderBy: (c, { asc }) => [asc(c.sortOrder), asc(c.name)],
  });

  return { success: true, data: rows };
}

// ----------------------------- create category -------------------------------
export async function createStockCategory(
  outletId: string,
  input: { name: string; sortOrder?: number },
): Promise<ControllerResult<typeof stockCategories.$inferSelect>> {
  try {
    const [category] = await db
      .insert(stockCategories)
      .values({
        outletId,
        name: input.name,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();

    return { success: true, data: category };
  } catch (error: any) {
    if (error?.code === "23505") {
      return {
        success: false,
        error: `A stock category named "${input.name}" already exists at this outlet`,
        status: 409,
      };
    }
    console.error("createStockCategory error:", error);
    return {
      success: false,
      error: "Failed to create stock category",
      status: 500,
    };
  }
}

// --------------------------- update category------------------------------------
export async function updateStockCategory(
  outletId: string,
  categoryId: string,
  input: { name?: string; sortOrder?: number; isActive?: boolean },
): Promise<ControllerResult<typeof stockCategories.$inferSelect>> {
  const existing = await db.query.stockCategories.findFirst({
    where: (c, { eq, and }) =>
      and(eq(c.id, categoryId), eq(c.outletId, outletId)),
    columns: { id: true },
  });

  if (!existing) {
    return { success: false, error: "Stock category not found", status: 404 };
  }

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateValues.name = input.name;
  if (input.sortOrder !== undefined) updateValues.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) updateValues.isActive = input.isActive;

  if (Object.keys(updateValues).length === 1) {
    return {
      success: false,
      error: "Provide at least one field to update",
      status: 400,
    };
  }

  try {
    const [updated] = await db
      .update(stockCategories)
      .set(updateValues)
      .where(
        and(
          eq(stockCategories.id, categoryId),
          eq(stockCategories.outletId, outletId),
        ),
      )
      .returning();

    return { success: true, data: updated };
  } catch (error: any) {
    if (error?.code === "23505") {
      return {
        success: false,
        error: `A stock category named "${input.name}" already exists at this outlet`,
        status: 409,
      };
    }
    console.error("updateStockCategory error:", error);
    return {
      success: false,
      error: "Failed to update stock category",
      status: 500,
    };
  }
}
// -----------------------------------DELETE STOCK CATEGORY----------------------------
// Safe to delete unconditionally — stock_items.category_id is nullable
// with ON DELETE SET NULL, so any items in this category simply become
// uncategorized rather than being blocked or cascade-deleted.
export async function deleteStockCategory(
  outletId: string,
  categoryId: string,
): Promise<ControllerResult<null>> {
  const existing = await db.query.stockCategories.findFirst({
    where: (c, { eq, and }) =>
      and(eq(c.id, categoryId), eq(c.outletId, outletId)),
    columns: { id: true },
  });

  if (!existing) {
    return { success: false, error: "Stock category not found", status: 404 };
  }

  try {
    await db.delete(stockCategories).where(eq(stockCategories.id, categoryId));
    return { success: true, data: null };
  } catch (error) {
    console.error("deleteStockCategory error:", error);
    return {
      success: false,
      error: "Failed to delete stock category",
      status: 500,
    };
  }
}

// -------------------------------- get specific category
export async function getStockCategoryById(
  id: string,
  outletId: string,
) {
  try {
    const category = await db.query.stockCategories.findFirst({
      where: and(
        eq(stockCategories.id, id),
        eq(stockCategories.outletId, outletId),
      ),
    });

    if (!category) {
      return {
        success: false,
        status: 404,
        error: "Stock category not found",
      };
    }

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Failed to fetch stock category:", error);

    return {
      success: false,
      status: 500,
      error: "Failed to fetch stock category",
    };
  }
}