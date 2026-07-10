// ─────────────────────────────────────────────
// TYPES
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
// import { stockItems, stockMovements } from "@/db/schema";
import { stockItems, stockMovements } from "@/db/schema/stock";
import { and, eq, inArray, sql } from "drizzle-orm";

// ─────────────────────────────────────────────
// interface OrderItemInput {
//   id: string; // orderItem id
//   productId: string | null;
//   quantity: number;
// }
interface OrderItemInput {
  id: string;
  productId: string | null;
  variantId: string | null; // ← added
  quantity: number;
}
interface DeductionResult {
  success: boolean;
  stockWarnings: string[];
}

// ─────────────────────────────────────────────
// HELPER — mark product unavailable if stock hits 0
// ─────────────────────────────────────────────
// async function syncProductAvailability(outletId: string, stockItemId: string) {
//   // get updated stock level
//   const stockItem = await db.query.stockItems.findFirst({
//     where: (s, { eq }) => eq(s.id, stockItemId),
//     columns: { currentStock: true },
//   });

//   const currentStock = Number(stockItem?.currentStock ?? 0);

//   // find all recipes that use this stock item
//   const affectedRecipes = await db.query.recipeItems.findMany({
//     where: (ri, { eq }) => eq(ri.stockItemId, stockItemId),
//     with: {
//       recipe: {
//         columns: { productId: true, outletId: true },
//       },
//     },
//   });

//   // filter recipes belonging to this outlet
//   const outletRecipes = affectedRecipes.filter(
//     (ri) => ri.recipe.outletId === outletId,
//   );

//   if (outletRecipes.length === 0) return;

//   const productIds = outletRecipes.map((ri) => ri.recipe.productId);

//   if (currentStock <= 0) {
//     // stock hit 0 → mark all affected products unavailable
//     await db
//       .update(products)
//       .set({ isAvailable: false, updatedAt: new Date() })
//       .where(
//         and(eq(products.outletId, outletId), inArray(products.id, productIds)),
//       );
//   }
// }

// ─────────────────────────────────────────────
// HELPER — log a single stock movement
// ─────────────────────────────────────────────

async function syncProductAvailability(outletId: string, stockItemId: string) {
  const stockItem = await db.query.stockItems.findFirst({
    where: (s, { eq }) => eq(s.id, stockItemId),
    columns: { currentStock: true, minStockLevel: true }, // ← minStockLevel now needed
  });

  const currentStock = Number(stockItem?.currentStock ?? 0);
  const minStock      = Number(stockItem?.minStockLevel ?? 0);

  // ── CHANGED — now triggers at/below the low-stock line, not just at zero ──
  if (currentStock > minStock) return;

  const affectedRecipes = await db.query.recipeItems.findMany({
    where: (ri, { eq }) => eq(ri.stockItemId, stockItemId),
    with: {
      recipe: {
        columns: { productId: true, variantId: true, outletId: true },
      },
    },
  });

  const outletRecipes = affectedRecipes.filter(
    (ri) => ri.recipe.outletId === outletId
  );

  if (outletRecipes.length === 0) return;

  const variantIdsToMarkUnavailable = outletRecipes
    .filter((ri) => ri.recipe.variantId !== null)
    .map((ri) => ri.recipe.variantId as string);

  const productIdsToMarkUnavailable = outletRecipes
    .filter((ri) => ri.recipe.variantId === null)
    .map((ri) => ri.recipe.productId);

  if (variantIdsToMarkUnavailable.length > 0) {
    await db
      .update(productVariants)
      .set({ isAvailable: false, updatedAt: new Date() })
      .where(inArray(productVariants.id, variantIdsToMarkUnavailable));
  }

  if (productIdsToMarkUnavailable.length > 0) {
    await db
      .update(products)
      .set({ isAvailable: false, updatedAt: new Date() })
      .where(
        and(eq(products.outletId, outletId), inArray(products.id, productIdsToMarkUnavailable))
      );
  }
}





async function logStockMovement(input: {
  outletId: string;
  stockItemId: string;
  type: "purchase" | "deduction" | "wastage" | "adjustment";
  quantity: number;
  orderId?: string;
  note?: string;
  createdBy?: string;
}) {
  await db.insert(stockMovements).values({
    outletId: input.outletId,
    stockItemId: input.stockItemId,
    type: input.type,
    quantity: input.quantity.toFixed(3),
    orderId: input.orderId ?? null,
    note: input.note ?? null,
    createdBy: input.createdBy ?? null,
  });
}

// async function deductFromStock(stockItemId: string, quantity: number) {
//   await db
//     .update(stockItems)
//     .set({
//       currentStock: db.$count(
//         stockItems,
//         // raw SQL: currentStock - quantity (never below 0)
//         // using Drizzle sql operator
//       ) as any,
//       updatedAt: new Date(),
//     })
//     .where(eq(stockItems.id, stockItemId));

//   // use raw SQL to safely deduct without going below 0
//   await db.execute(
//     `UPDATE stock_items
//      SET current_stock = GREATEST(current_stock - $1, 0),
//          updated_at = NOW()
//      WHERE id = $2`,
//     [quantity.toFixed(3), stockItemId],
//   );
// }

// ─────────────────────────────────────────────
// MAIN — deduct stock for an entire order
// called from orderController after order items inserted
// ─────────────────────────────────────────────
/*
Why created: This is the most important one — called automatically every time an order is placed. Without this, inventory never decreases when food is sold.
*/
async function deductFromStock(
  stockItemId: string,
  outletId: string, // ← add outletId
  quantity: number,
) {
  await db
    .update(stockItems)
    .set({
      currentStock: sql`GREATEST(current_stock - ${quantity.toFixed(3)}::numeric, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(stockItems.id, stockItemId));

  // ← check and update product availability
  await syncProductAvailability(outletId, stockItemId);
}
// export async function deductStockForOrder(
//   outletId: string,
//   orderId: string,
//   items: OrderItemInput[],
//   createdBy?: string,
// ): Promise<DeductionResult> {
//   const warnings: string[] = [];
//   // filter out items with no productId (deleted products)
//   const validItems = items.filter((i) => i.productId !== null);

//   if (validItems.length === 0) {
//     return { success: true, stockWarnings: [] };
//   }

//   const productIds = validItems.map((i) => i.productId as string);

//   // ── 1. fetch all recipes for products in this order in one query ──
//   const recipeRows = await db.query.recipes.findMany({
//     where: (r, { eq, and, inArray }) =>
//       and(eq(r.outletId, outletId), inArray(r.productId, productIds)),
//     with: {
//       recipeItems: {
//         with: {
//           stockItem: {
//             columns: {
//               id: true,
//               name: true,
//               currentStock: true,
//               minStockLevel: true,
//               unit: true,
//             },
//           },
//         },
//       },
//     },
//   });

//   // build map: productId → recipe
//   const recipeMap = new Map(recipeRows.map((r) => [r.productId, r]));
//   // ── 2. fetch product names for warnings ──
//   const productNames = await db.query.products.findMany({
//     where: (p, { inArray }) => inArray(p.id, productIds),
//     columns: { id: true, name: true },
//   });
//   const productNameMap = new Map(productNames.map((p) => [p.id, p.name]));

//   // ── 3. process each order item ──
//   for (const item of validItems) {
//     const productName =
//       productNameMap.get(item.productId!) ?? "Unknown Product";
//     const recipe = recipeMap.get(item.productId!);

//     // ── no recipe set up ──
//     if (!recipe || recipe.recipeItems.length === 0) {
//       warnings.push(
//         `No recipe found for "${productName}" — stock not deducted`,
//       );
//       continue;
//     }
//     // ── process each ingredient in the recipe ──
//     for (const ri of recipe.recipeItems) {
//       const stockItem = ri.stockItem;
//       const requiredAmount = Number(ri.quantity) * item.quantity;
//       const currentStock = Number(stockItem.currentStock);
//       const minStock = Number(stockItem.minStockLevel);

//       // ── check if stock is sufficient ──
//       if (currentStock <= 0) {
//         warnings.push(
//           `"${stockItem.name}" is out of stock (required: ${requiredAmount}${stockItem.unit} for "${productName}")`,
//         );
//       } else if (currentStock - requiredAmount < minStock) {
//         warnings.push(
//           `Low stock: "${stockItem.name}" will fall below minimum level after this order (remaining: ${(currentStock - requiredAmount).toFixed(2)}${stockItem.unit})`,
//         );
//       }
//       // ── deduct stock regardless (allow but flag) ──
//       await deductFromStock(stockItem.id, outletId, requiredAmount);

//       // ── log movement ──
//       await logStockMovement({
//         outletId,
//         stockItemId: stockItem.id,
//         type: "deduction",
//         quantity: requiredAmount,
//         orderId,
//         note: `Auto-deducted for order — ${item.quantity}x ${productName}`,
//         createdBy,
//       });
//     }
//   }
//   return {
//     success: true,
//     stockWarnings: warnings,
//   };
// }

// ─────────────────────────────────────────────
// HELPER — restore product availability after restock
// ─────────────────────────────────────────────

export async function deductStockForOrder(
  outletId: string,
  orderId: string,
  items: OrderItemInput[],
  createdBy?: string,
): Promise<DeductionResult> {
  const warnings: string[] = [];
  const validItems = items.filter((i) => i.productId !== null);

  if (validItems.length === 0) {
    return { success: true, stockWarnings: [] };
  }

  const productIds = validItems.map((i) => i.productId as string);
  const variantIds = validItems
    .filter((i) => i.variantId !== null)
    .map((i) => i.variantId as string);
  // ── fetch recipes matching EITHER the product-level default
  //    OR a variant-specific recipe, in one query ──
  const recipeRows = await db.query.recipes.findMany({
    where: (r, { eq, and, inArray, or, isNull }) =>
      and(
        eq(r.outletId, outletId),
        or(
          and(inArray(r.productId, productIds), isNull(r.variantId)),
          variantIds.length > 0 ? inArray(r.variantId, variantIds) : sql`false`,
        ),
      ),
    with: {
      recipeItems: {
        with: {
          stockItem: {
            columns: {
              id: true,
              name: true,
              currentStock: true,
              minStockLevel: true,
              unit: true,
            },
          },
        },
      },
    },
  });
  // ── two lookup maps: prefer variant-specific match, fall back to product-level ──
  const recipeByVariantId = new Map(
    recipeRows
      .filter((r) => r.variantId !== null)
      .map((r) => [r.variantId!, r]),
  );
  const recipeByProductId = new Map(
    recipeRows.filter((r) => r.variantId === null).map((r) => [r.productId, r]),
  );

  const productNames = await db.query.products.findMany({
    where: (p, { inArray }) => inArray(p.id, productIds),
    columns: { id: true, name: true },
  });
  const productNameMap = new Map(productNames.map((p) => [p.id, p.name]));

  for (const item of validItems) {
    const productName =
      productNameMap.get(item.productId!) ?? "Unknown Product";

    // ── KEY CHANGE — check variant-specific recipe FIRST, then fall back ──
    const recipe = item.variantId
      ? (recipeByVariantId.get(item.variantId) ??
        recipeByProductId.get(item.productId!))
      : recipeByProductId.get(item.productId!);

    if (!recipe || recipe.recipeItems.length === 0) {
      warnings.push(
        `No recipe found for "${productName}" — stock not deducted`,
      );
      continue;
    }
    for (const ri of recipe.recipeItems) {
      const stockItem = ri.stockItem;
      const requiredAmount = Number(ri.quantity) * item.quantity;
      const currentStock = Number(stockItem.currentStock);
      const minStock = Number(stockItem.minStockLevel);

      if (currentStock <= 0) {
        warnings.push(
          `"${stockItem.name}" is out of stock (required: ${requiredAmount}${stockItem.unit} for "${productName}")`,
        );
      } else if (currentStock - requiredAmount < minStock) {
        warnings.push(
          `Low stock: "${stockItem.name}" will fall below minimum level after this order (remaining: ${(currentStock - requiredAmount).toFixed(2)}${stockItem.unit})`,
        );
      }
      await deductFromStock(stockItem.id, outletId, requiredAmount);

      await logStockMovement({
        outletId,
        stockItemId: stockItem.id,
        type: "deduction",
        quantity: requiredAmount,
        orderId,
        note: `Auto-deducted for order — ${item.quantity}x ${productName}`,
        createdBy,
      });
    }
  }

  return { success: true, stockWarnings: warnings };
}

// async function restoreProductAvailability(
//   outletId: string,
//   stockItemId: string,
// ) {
//   // find all recipes that use this stock item
//   const affectedRecipes = await db.query.recipeItems.findMany({
//     where: (ri, { eq }) => eq(ri.stockItemId, stockItemId),
//     with: {
//       recipe: {
//         columns: { productId: true, outletId: true },
//         with: {
//           recipeItems: {
//             with: {
//               stockItem: {
//                 columns: { currentStock: true },
//               },
//             },
//           },
//         },
//       },
//     },
//   });

//   // filter recipes belonging to this outlet
//   const outletRecipes = affectedRecipes.filter(
//     (ri) => ri.recipe.outletId === outletId,
//   );

//   if (outletRecipes.length === 0) return;

//   // only restore products where ALL ingredients are back in stock
//   const productIdsToRestore: string[] = [];

//   for (const ri of outletRecipes) {
//     const allInStock = ri.recipe.recipeItems.every(
//       (item) => Number(item.stockItem.currentStock) > 0,
//     );
//     if (allInStock) {
//       productIdsToRestore.push(ri.recipe.productId);
//     }
//   }

//   if (productIdsToRestore.length === 0) return;

//   await db
//     .update(products)
//     .set({ isAvailable: true, updatedAt: new Date() })
//     .where(
//       and(
//         eq(products.outletId, outletId),
//         inArray(products.id, productIdsToRestore),
//       ),
//     );
// }

// ─────────────────────────────────────────────
// RESTORE STOCK ON ORDER CANCEL
// ─────────────────────────────────────────────

async function restoreProductAvailability(outletId: string, stockItemId: string) {
  const affectedRecipes = await db.query.recipeItems.findMany({
    where: (ri, { eq }) => eq(ri.stockItemId, stockItemId),
    with: {
      recipe: {
        columns: { productId: true, variantId: true, outletId: true },
        with: {
          recipeItems: {
            with: {
              stockItem: { columns: { currentStock: true, minStockLevel: true } }, // ← minStockLevel added
            },
          },
        },
      },
    },
  });

  const outletRecipes = affectedRecipes.filter(
    (ri) => ri.recipe.outletId === outletId
  );

  if (outletRecipes.length === 0) return;

  const variantIdsToRestore: string[] = [];
  const productIdsToRestore: string[] = [];

  for (const ri of outletRecipes) {
    // ── CHANGED — every ingredient must be ABOVE its own min level,
    //    not just above zero, before we restore availability ──
    const allAboveMinLevel = ri.recipe.recipeItems.every(
      (item) => Number(item.stockItem.currentStock) > Number(item.stockItem.minStockLevel)
    );

    if (!allAboveMinLevel) continue;

    if (ri.recipe.variantId !== null) {
      variantIdsToRestore.push(ri.recipe.variantId);
    } else {
      productIdsToRestore.push(ri.recipe.productId);
    }
  }

  if (variantIdsToRestore.length > 0) {
    await db
      .update(productVariants)
      .set({ isAvailable: true, updatedAt: new Date() })
      .where(inArray(productVariants.id, variantIdsToRestore));
  }

  if (productIdsToRestore.length > 0) {
    await db
      .update(products)
      .set({ isAvailable: true, updatedAt: new Date() })
      .where(
        and(eq(products.outletId, outletId), inArray(products.id, productIdsToRestore))
      );
  }
}







export async function restoreStockForOrder(
  outletId: string,
  orderId: string,
): Promise<void> {
  // find all deduction movements for this order
  const movements = await db.query.stockMovements.findMany({
    where: (m, { eq, and }) =>
      and(
        eq(m.orderId, orderId),
        eq(m.outletId, outletId),
        eq(m.type, "deduction"),
      ),
    columns: {
      stockItemId: true,
      quantity: true,
    },
  });

  if (movements.length === 0) return;

  for (const movement of movements) {
    // ── restore stock ──
    await db
      .update(stockItems)
      .set({
        currentStock: sql`current_stock + ${Number(movement.quantity).toFixed(3)}::numeric`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(stockItems.id, movement.stockItemId),
          eq(stockItems.outletId, outletId),
        ),
      );

    // ── log restoration ──
    await logStockMovement({
      outletId,
      stockItemId: movement.stockItemId,
      type: "adjustment",
      quantity: Number(movement.quantity),
      orderId,
      note: "Stock restored — order cancelled",
    });

    // ── restore product availability ──
    await restoreProductAvailability(outletId, movement.stockItemId);
  }
}
// ─────────────────────────────────────────────
// ADD STOCK — purchase (delivery arrived)
// ─────────────────────────────────────────────
/*
Why created: When a new delivery arrives (flour, milk, coffee beans etc.), Manager needs to manually add stock. Without this, stock only ever goes down — it can never be refilled.
*/
export async function addStockPurchase(input: {
  outletId: string;
  stockItemId: string;
  quantity: number;
  note?: string;
  createdBy?: string;
}): Promise<{ newStock: number }> {
  const { outletId, stockItemId, quantity, note, createdBy } = input;

  await db
    .update(stockItems)
    .set({
      currentStock: sql`current_stock + ${quantity.toFixed(3)}::numeric`,
      updatedAt: new Date(),
    })
    .where(
      and(eq(stockItems.id, stockItemId), eq(stockItems.outletId, outletId)),
    );

  await logStockMovement({
    outletId,
    stockItemId,
    type: "purchase",
    quantity,
    note: note ?? "Stock purchase",
    createdBy,
  });

  // ── restore product availability after restock ── ← ADD
  await restoreProductAvailability(outletId, stockItemId);

  const updated = await db.query.stockItems.findFirst({
    where: (s, { eq }) => eq(s.id, stockItemId),
    columns: { currentStock: true },
  });

  return { newStock: Number(updated?.currentStock ?? 0) };
}
// ─────────────────────────────────────────────
// LOG WASTAGE
// ─────────────────────────────────────────────

/*
Why created: Stock doesn't only decrease from sales — ingredients expire, get spilled, or are damaged. 
Manager needs to record this separately from sales so reports show the difference between what was sold vs what was wasted.
What it does:
Manager finds 500ml of milk has expired
  → logs 500ml as wastage
  → currentStock goes from 2000ml → 1500ml
  → logs movement type: "wastage"
  → returns new stock level
*/
export async function logWastage(input: {
  outletId: string;
  stockItemId: string;
  quantity: number;
  note?: string;
  createdBy?: string;
}): Promise<{ newStock: number }> {
  const { outletId, stockItemId, quantity, note, createdBy } = input;

  await db
    .update(stockItems)
    .set({
      currentStock: sql`GREATEST(current_stock - ${quantity.toFixed(3)}::numeric, 0)`,
      updatedAt: new Date(),
    })
    .where(
      and(eq(stockItems.id, stockItemId), eq(stockItems.outletId, outletId)),
    );

  await logStockMovement({
    outletId,
    stockItemId,
    type: "wastage",
    quantity,
    note: note ?? "Stock wastage",
    createdBy,
  });

  const updated = await db.query.stockItems.findFirst({
    where: (s, { eq }) => eq(s.id, stockItemId),
    columns: { currentStock: true },
  });

  return { newStock: Number(updated?.currentStock ?? 0) };
}

// ─────────────────────────────────────────────
// GET LOW STOCK ALERTS
// used by dashboard
// ─────────────────────────────────────────────

/*
getLowStockAlerts
Why created: Dashboard needs to show which ingredients are running low so Manager can reorder before they run out completely. This feeds directly into the Alerts section we built.
What it does:
Scans all active stock items for this outlet
  → finds items where currentStock <= minStockLevel
  → returns list with:
      name, currentStock, minStockLevel, unit
      isOutOfStock: true/false
*/

export async function getLowStockAlerts(outletId: string) {
  const items = await db.query.stockItems.findMany({
    where: (s, { eq, and }) =>
      and(eq(s.outletId, outletId), eq(s.isActive, true)),
    columns: {
      id: true,
      name: true,
      currentStock: true,
      minStockLevel: true,
      unit: true,
    },
  });

  return items
    .filter((item) => Number(item.currentStock) <= Number(item.minStockLevel))
    .map((item) => ({
      id: item.id,
      name: item.name,
      currentStock: Number(item.currentStock),
      minStockLevel: Number(item.minStockLevel),
      unit: item.unit,
      isOutOfStock: Number(item.currentStock) <= 0,
    }));
}

// ─────────────────────────────────────────────
// MANUAL ADJUSTMENT (stocktake correction)
// ─────────────────────────────────────────────

/*
Why created: After a physical stocktake (counting actual stock on shelves), the DB number might not match reality due to unrecorded wastage, measurement errors etc. Manager needs to correct it to the actual count.
What it does:
DB says: Coffee Beans = 2000g
Manager counts shelf: actually 1750g
  → sets currentStock TO 1750g (not subtract, SET)
  → calculates difference (250g) for the movement log
  → logs movement type: "adjustment"
  → returns new stock level
Key difference from wastage:
wastage   → "I know exactly what was wasted, subtract it"
adjustment → "I don't know what happened, just set it to the correct number"
*/
export async function adjustStock(input: {
  outletId: string;
  stockItemId: string;
  newQuantity: number;
  note?: string;
  createdBy?: string;
}): Promise<{ newStock: number }> {
  const { outletId, stockItemId, newQuantity, note, createdBy } = input;

  const current = await db.query.stockItems.findFirst({
    where: (s, { eq }) => eq(s.id, stockItemId),
    columns: { currentStock: true },
  });

  const currentStock = Number(current?.currentStock ?? 0);
  const difference = Math.abs(newQuantity - currentStock);

  await db
    .update(stockItems)
    .set({
      currentStock: newQuantity.toFixed(3),
      updatedAt: new Date(),
    })
    .where(
      and(eq(stockItems.id, stockItemId), eq(stockItems.outletId, outletId)),
    );

  await logStockMovement({
    outletId,
    stockItemId,
    type: "adjustment",
    quantity: difference,
    note: note ?? `Manual adjustment: ${currentStock} → ${newQuantity}`,
    createdBy,
  });

  // ── sync availability based on new quantity ── ← ADD
  if (newQuantity <= 0) {
    await syncProductAvailability(outletId, stockItemId);
  } else {
    await restoreProductAvailability(outletId, stockItemId);
  }

  return { newStock: newQuantity };
}
