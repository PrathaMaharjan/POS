import { db } from "@/db";
import { products, stockCategories, stockItems, stockMovements } from "@/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { addStockPurchase, adjustStock, logWastage } from "./inventoy";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as any).code === "23505"
  );
}
function formatStockItem(item: {
  id: string;
  name: string;
  unit: string;
  currentStock: string;
  minStockLevel: string;
  isActive: boolean;
  createdAt: Date;
}) {
  const current = Number(item.currentStock);
  const min = Number(item.minStockLevel);

  return {
    ...item,
    currentStock: current,
    minStockLevel: min,
    isLowStock: current <= min && min > 0, // at or below threshold
    isOutOfStock: current <= 0, // completely empty
  };
}
async function restoreProductAvailability(
  outletId: string,
  stockItemId: string,
) {
  // find all recipes that use this stock item
  const affectedRecipes = await db.query.recipeItems.findMany({
    where: (ri, { eq }) => eq(ri.stockItemId, stockItemId),
    with: {
      recipe: {
        columns: { productId: true, outletId: true },
        with: {
          recipeItems: {
            with: {
              stockItem: {
                columns: { currentStock: true },
              },
            },
          },
        },
      },
    },
  });

  // filter recipes belonging to this outlet
  const outletRecipes = affectedRecipes.filter(
    (ri) => ri.recipe.outletId === outletId,
  );

  if (outletRecipes.length === 0) return;

  // only restore products where ALL ingredients are in stock
  const productIdsToRestore: string[] = [];

  for (const ri of outletRecipes) {
    const allInStock = ri.recipe.recipeItems.every(
      (item) => Number(item.stockItem.currentStock) > 0,
    );

    if (allInStock) {
      productIdsToRestore.push(ri.recipe.productId);
    }
  }

  if (productIdsToRestore.length === 0) return;

  // restore availability for products where all ingredients back in stock
  await db
    .update(products)
    .set({ isAvailable: true, updatedAt: new Date() })
    .where(
      and(
        eq(products.outletId, outletId),
        inArray(products.id, productIdsToRestore),
      ),
    );
}
// ─────────────────────────────────────────────
// CREATE STOCK ITEM
// ─────────────────────────────────────────────
export async function createStockItem(
  outletId: string,
  input: {
    name: string;
   unit: "g" | "kg" | "ml" | "L" | "pieces" | "pack" | "box" | "bottle" | "can" | "bag" | "other";
    currentStock?: number;
    minStockLevel?: number;
    categoryId: string;
  },
): Promise<ControllerResult<ReturnType<typeof formatStockItem>>> {
  try {
    const [item] = await db
      .insert(stockItems)
      .values({
        outletId,
        name: input.name,
        unit: input.unit,
        currentStock: (input.currentStock ?? 0).toFixed(3),
        minStockLevel: (input.minStockLevel ?? 0).toFixed(3),
        categoryId: input.categoryId,
      })
      .returning();

    return { success: true, data: formatStockItem(item) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: `A stock item named "${input.name}" already exists in this outlet`,
        status: 409,
      };
    }
    console.error("createStockItem error:", error);
    return {
      success: false,
      error: "Failed to create stock item",
      status: 500,
    };
  }
}

// ─────────────────────────────────────────────
// LIST STOCK ITEMS
// ─────────────────────────────────────────────
// export async function listStockItems(outletId: string) {
//   const items = await db.query.stockItems.findMany({
//     where: (s, { eq, and }) =>
//       and(eq(s.outletId, outletId), eq(s.isActive, true)),
//     columns: {
//       id: true,
//       name: true,
//       unit: true,
//       currentStock: true,
//       minStockLevel: true,
//       isActive: true,
//       createdAt: true,
//     },
//     orderBy: (s, { asc }) => asc(s.name),
//   });

//   const formatted = items.map(formatStockItem);

//   return {
//     stockItems: formatted,
//     lowStockCount: formatted.filter((i) => i.isLowStock).length,
//     outOfStockCount: formatted.filter((i) => i.isOutOfStock).length,
//   };
// }
export async function listStockItems(outletId: string) {
  const items = await db.query.stockItems.findMany({
    where: (s, { eq, and }) =>
      and(eq(s.outletId, outletId), eq(s.isActive, true)),
    columns: {
      id: true,
      name: true,
      unit: true,
      currentStock: true,
      minStockLevel: true,
      isActive: true,
      createdAt: true,
      categoryId: true, 
    },
    with: {
      category: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: (s, { asc }) => asc(s.name),
  });

  const formatted = items.map((item) => ({
    ...formatStockItem(item),
    categoryId: item.categoryId,
    categoryName: item.category?.name ?? null,
  }));

  return {
    stockItems: formatted,
    lowStockCount: formatted.filter((i) => i.isLowStock).length,
    outOfStockCount: formatted.filter((i) => i.isOutOfStock).length,
  };
}
// ─────────────────────────────────────────────
// GET SINGLE STOCK ITEM
// ─────────────────────────────────────────────
export async function getStockItemById(
  outletId: string,
  stockItemId: string,
): Promise<ControllerResult<ReturnType<typeof formatStockItem>>> {
  const item = await db.query.stockItems.findFirst({
    where: (s, { eq, and }) =>
      and(eq(s.id, stockItemId), eq(s.outletId, outletId)),
    columns: {
      id: true,
      name: true,
      unit: true,
      currentStock: true,
      minStockLevel: true,
      isActive: true,
      createdAt: true,
      categoryId:true
    },
     with: {
      category: {
        columns: {
          name: true,
        },
      },
    },
  });

  if (!item) {
    return { success: false, error: "Stock item not found", status: 404 };
  }

  return { success: true, data: formatStockItem(item) };
}

// ─────────────────────────────────────────────
// DELETE STOCK ITEM (soft delete)
// ─────────────────────────────────────────────
export async function deleteStockItem(
  outletId: string,
  stockItemId: string,
): Promise<ControllerResult<null>> {
  const existing = await db.query.stockItems.findFirst({
    where: (s, { eq, and }) =>
      and(eq(s.id, stockItemId), eq(s.outletId, outletId)),
    columns: { id: true },
  });

  if (!existing) {
    return { success: false, error: "Stock item not found", status: 404 };
  }

  await db
    .update(stockItems)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(eq(stockItems.id, stockItemId), eq(stockItems.outletId, outletId)),
    );

  return { success: true, data: null };
}
// ─────────────────────────────────────────────
// UPDATE STOCK ITEM
// ─────────────────────────────────────────────
export async function updateStockItem(
  outletId: string,
  stockItemId: string,
  input: {
    name?: string;
    minStockLevel?: number;
    categoryId?: string;
  },
): Promise<ControllerResult<ReturnType<typeof formatStockItem>>> {
  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateValues.name = input.name;
  if (input.minStockLevel !== undefined)
    updateValues.minStockLevel = input.minStockLevel.toFixed(3);
  if (input.categoryId !== undefined)
    updateValues.categoryId = input.categoryId;

  try {
    const [updated] = await db
      .update(stockItems)
      .set(updateValues)
      .where(
        and(
          eq(stockItems.id, stockItemId),
          eq(stockItems.outletId, outletId),
          eq(stockItems.isActive, true),
        ),
      )
      .returning();

    if (!updated) {
      return {
        success: false,
        error: "Stock item not found or has been deleted",
        status: 404,
      };
    }

    return { success: true, data: formatStockItem(updated) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: `A stock item named "${input.name}" already exists in this outlet`,
        status: 409,
      };
    }

    return {
      success: false,
      error: "Failed to update stock item",
      status: 500,
    };
  }
}

// ─────────────────────────────────────────────
// ADD PURCHASE (restock) -> add the stock
// ─────────────────────────────────────────────
export async function purchaseStockItem(
  outletId: string,
  stockItemId: string,
  input: { quantity: number; note?: string },
  createdBy?: string,
): Promise<ControllerResult<{ newStock: number }>> {
  const existing = await db.query.stockItems.findFirst({
    where: (s, { eq, and }) =>
      and(
        eq(s.id, stockItemId),
        eq(s.outletId, outletId),
        eq(s.isActive, true),
      ),
    columns: { id: true },
  });

  if (!existing) {
    return { success: false, error: "Stock item not found", status: 404 };
  }

  if (input.quantity <= 0) {
    return {
      success: false,
      error: "Purchase quantity must be greater than 0",
      status: 400,
    };
  }
  await restoreProductAvailability(outletId, stockItemId);
  const result = await addStockPurchase({
    outletId,
    stockItemId,
    quantity: input.quantity,
    note: input.note,
    createdBy,
  });

  return { success: true, data: result };
}

export async function wasteStockItem(
  outletId: string,
  stockItemId: string,
  input: { quantity: number; note?: string },
  createdBy?: string,
): Promise<ControllerResult<{ newStock: number }>> {
  const existing = await db.query.stockItems.findFirst({
    where: (s, { eq, and }) =>
      and(
        eq(s.id, stockItemId),
        eq(s.outletId, outletId),
        eq(s.isActive, true),
      ),
    columns: { id: true, currentStock: true },
  });

  if (!existing) {
    return { success: false, error: "Stock item not found", status: 404 };
  }

  if (input.quantity <= 0) {
    return {
      success: false,
      error: "Wastage quantity must be greater than 0",
      status: 400,
    };
  }

  if (input.quantity > Number(existing.currentStock)) {
    return {
      success: false,
      error: "Wastage quantity cannot exceed current stock",
      status: 400,
    };
  }

  const result = await logWastage({
    outletId,
    stockItemId,
    quantity: input.quantity,
    note: input.note,
    createdBy,
  });

  return { success: true, data: result };
}
// ─────────────────────────────────────────────
// MANUAL ADJUSTMENT (stocktake)
// ─────────────────────────────────────────────
export async function adjustStockItem(
  outletId: string,
  stockItemId: string,
  input: { newQuantity: number; note?: string },
  createdBy?: string,
): Promise<ControllerResult<{ newStock: number }>> {
  const existing = await db.query.stockItems.findFirst({
    where: (s, { eq, and }) =>
      and(
        eq(s.id, stockItemId),
        eq(s.outletId, outletId),
        eq(s.isActive, true),
      ),
    columns: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Stock item not found or has been deleted",
      status: 404,
    };
  }

  if (input.newQuantity < 0) {
    return {
      success: false,
      error: "Stock quantity cannot be negative",
      status: 400,
    };
  }

  // adjustStock already handles syncProductAvailability
  // and restoreProductAvailability internally
  const result = await adjustStock({
    outletId,
    stockItemId,
    newQuantity: input.newQuantity,
    note: input.note,
    createdBy,
  });

  return { success: true, data: result };
}

// ─────────────────────────────────────────────
// MOVEMENT HISTORY (audit trail)
// ─────────────────────────────────────────────
export async function getStockMovements(
  outletId: string,
  stockItemId: string,
  limit: number,
  offset: number,
) {
  const existing = await db.query.stockItems.findFirst({
    where: (s, { eq, and }) =>
      and(eq(s.id, stockItemId), eq(s.outletId, outletId)),
    columns: { id: true, name: true, unit: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Stock item not found",
      status: 404,
    } as const;
  }

  const [rows, totalResult] = await Promise.all([
    db.query.stockMovements.findMany({
      where: (m, { eq, and }) =>
        and(eq(m.stockItemId, stockItemId), eq(m.outletId, outletId)),
      columns: {
        id: true,
        type: true,
        quantity: true,
        note: true,
        orderId: true,
        createdAt: true,
      },
      with: {
        createdBy: {
          columns: { name: true },
        },
      },
      orderBy: (m, { desc }) => desc(m.createdAt),
      limit,
      offset,
    }),

    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.stockItemId, stockItemId),
          eq(stockMovements.outletId, outletId),
        ),
      ),
  ]);

  return {
    success: true,
    data: {
      stockItem: existing,
      movements: rows.map((m) => ({
        ...m,
        quantity: Number(m.quantity),
        createdByName: (m.createdBy as any)?.name ?? "System",
      })),
      total: Number(totalResult[0]?.count ?? 0),
    },
  } as const;
}


// get stock with category
export async function getStockItemsByCategory(
  outletId: string,
  categoryId: string,
): Promise<
  ControllerResult<{
    category: {
      id: string;
      name: string;
    };
    stockItems: ReturnType<typeof formatStockItem>[];
    lowStockCount: number;
    outOfStockCount: number;
  }>
> {
  try {
    // Check category exists
    const category = await db.query.stockCategories.findFirst({
      where: and(
        eq(stockCategories.id, categoryId),
        eq(stockCategories.outletId, outletId),
        eq(stockCategories.isActive, true),
      ),
      columns: {
        id: true,
        name: true,
      },
    });

    if (!category) {
      return {
        success: false,
        error: "Category not found",
        status: 404,
      };
    }

    // Fetch stock items
    const items = await db.query.stockItems.findMany({
      where: and(
        eq(stockItems.outletId, outletId),
        eq(stockItems.categoryId, categoryId),
        eq(stockItems.isActive, true),
      ),
      columns: {
        id: true,
        name: true,
        unit: true,
        currentStock: true,
        minStockLevel: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: asc(stockItems.name),
    });

    const formattedItems = items.map(formatStockItem);

    return {
      success: true,
      data: {
        category,
        stockItems: formattedItems,
        lowStockCount: formattedItems.filter((item) => item.isLowStock).length,
        outOfStockCount: formattedItems.filter((item) => item.isOutOfStock)
          .length,
      },
    };
  } catch (error) {
    console.error("getStockItemsByCategory error:", error);

    return {
      success: false,
      error: "Failed to fetch stock items",
      status: 500,
    };
  }
}