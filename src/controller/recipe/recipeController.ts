import { db } from "@/db";
import { recipeItems, recipes } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

// HELPER — format recipe response
function formatRecipe(recipe: {
  id: string;
  productId: string;
  outletId: string;
  product: {
    name: string;
  };
  recipeItems: {
    id: string;
    quantity: string;
    stockItem: {
      id: string;
      name: string;
      unit: string;
    };
  }[];
}) {
  return {
    recipeId: recipe.id,
    productId: recipe.productId,
    productName: recipe.product.name,
    outletId: recipe.outletId,
    items: recipe.recipeItems.map((ri) => ({
      id: ri.id,
      stockItemId: ri.stockItem.id,
      stockItemName: ri.stockItem.name,
      unit: ri.stockItem.unit,
      quantity: Number(ri.quantity),
    })),
  };
}
//--------------------------- get recipe wala -----------------------------
// export async function getRecipe(
//   outletId: string,
//   productId: string,
// ): Promise<ControllerResult<ReturnType<typeof formatRecipe> | null>> {
//   // verify product belongs to outlet
//   const product = await db.query.products.findFirst({
//     where: (p, { eq, and }) =>
//       and(eq(p.id, productId), eq(p.outletId, outletId), eq(p.isActive, true)),
//     columns: { id: true, name: true },
//   });
//   if (!product) {
//     return { success: false, error: "Product not found", status: 404 };
//   }
//   const recipe = await db.query.recipes.findFirst({
//     where: (r, { eq, and }) =>
//       and(eq(r.productId, productId), eq(r.outletId, outletId)),
//     with: {
//       product: {
//         columns: { name: true },
//       },
//       recipeItems: {
//         with: {
//           stockItem: {
//             columns: { id: true, name: true, unit: true },
//           },
//         },
//       },
//     },
//   });
//   // no recipe set up yet — return null not 404
//   // so frontend can show "No recipe set up" instead of error
//   if (!recipe) {
//     return { success: true, data: null };
//   }

//   return { success: true, data: formatRecipe(recipe) };
// }
// export async function getRecipe(
//   outletId: string,
//   productId: string,
//   variantId?: string | null, // ← new
// ): Promise<ControllerResult<ReturnType<typeof formatRecipe> | null>> {
//   const product = await db.query.products.findFirst({
//     where: (p, { eq, and }) =>
//       and(eq(p.id, productId), eq(p.outletId, outletId), eq(p.isActive, true)),
//     columns: { id: true, name: true },
//   });
//   if (!product) {
//     return { success: false, error: "Product not found", status: 404 };
//   }

//   // ── if a variantId was given, verify it belongs to THIS product ──
//   if (variantId) {
//     const variant = await db.query.productVariants.findFirst({
//       where: (v, { eq, and }) => and(eq(v.id, variantId), eq(v.productId, productId)),
//       columns: { id: true },
//     });
//     if (!variant) {
//       return { success: false, error: "Variant does not belong to this product", status: 400 };
//     }
//   }

//   const recipe = await db.query.recipes.findFirst({
//     where: (r, { eq, and, isNull }) =>
//       and(
//         eq(r.productId, productId),
//         eq(r.outletId, outletId),
//         variantId ? eq(r.variantId, variantId) : isNull(r.variantId), // ← key change
//       ),
//     with: {
//       product: { columns: { name: true } },
//       variant: { columns: { id: true, label: true } }, // ← new relation, added earlier
//       recipeItems: {
//         with: {
//           stockItem: { columns: { id: true, name: true, unit: true } },
//         },
//       },
//     },
//   });

//   if (!recipe) {
//     return { success: true, data: null };
//   }

//   return { success: true, data: formatRecipe(recipe) };
// }


export async function getRecipe(
  outletId: string,
  productId: string,
  variantId?: string | null,
): Promise<ControllerResult<ReturnType<typeof formatRecipe> | null>> {

  // ── run product check + variant check (if needed) + recipe fetch
  //    ALL IN PARALLEL — none of these actually depend on each other's
  //    result, they're just three independent reads ──
  const [product, variant, recipe] = await Promise.all([
    db.query.products.findFirst({
      where: (p, { eq, and }) =>
        and(eq(p.id, productId), eq(p.outletId, outletId), eq(p.isActive, true)),
      columns: { id: true, name: true },
    }),

    variantId
      ? db.query.productVariants.findFirst({
          where: (v, { eq, and }) => and(eq(v.id, variantId), eq(v.productId, productId)),
          columns: { id: true },
        })
      : Promise.resolve(null),

    db.query.recipes.findFirst({
      where: (r, { eq, and, isNull }) =>
        and(
          eq(r.productId, productId),
          eq(r.outletId, outletId),
          variantId ? eq(r.variantId, variantId) : isNull(r.variantId),
        ),
      with: {
        product: { columns: { name: true } },
        variant: { columns: { id: true, label: true } },
        recipeItems: {
          with: {
            stockItem: { columns: { id: true, name: true, unit: true } },
          },
        },
      },
    }),
  ]);

  // ── now validate using whatever came back, no more waiting ──
  if (!product) {
    return { success: false, error: "Product not found", status: 404 };
  }

  if (variantId && !variant) {
    return { success: false, error: "Variant does not belong to this product", status: 400 };
  }

  if (!recipe) {
    return { success: true, data: null };
  }

  return { success: true, data: formatRecipe(recipe) };
}
// export async function createRecipe(
//   outletId: string,
//   productId: string,
//   input: {
//     items: {
//       stockItemId: string;
//       quantity: number;
//     }[];
//   },
// ): Promise<ControllerResult<ReturnType<typeof formatRecipe>>> {
//   const { items } = input;

//   if (items.length === 0) {
//     return {
//       success: false,
//       error: "Recipe must have at least one ingredient",
//       status: 400,
//     };
//   }
//   const product = await db.query.products.findFirst({
//     where: (p, { eq, and }) =>
//       and(eq(p.id, productId), eq(p.outletId, outletId), eq(p.isActive, true)),
//     columns: { id: true, name: true },
//   });

//   if (!product) {
//     return { success: false, error: "Product not found", status: 404 };
//   }
//   // ── 2. check recipe doesn't already exist ──
//   const existing = await db.query.recipes.findFirst({
//     where: (r, { eq, and }) =>
//       and(eq(r.productId, productId), eq(r.outletId, outletId)),
//     columns: { id: true },
//   });

//   if (existing) {
//     return {
//       success: false,
//       error: "Recipe already exists for this product. Use update instead.",
//       status: 409,
//     };
//   }
//   // ── 3. verify all stock items belong to this outlet ──
//   const stockItemIds = items.map((i) => i.stockItemId);

//   const validStockItems = await db.query.stockItems.findMany({
//     where: (s, { eq, and, inArray }) =>
//       and(
//         eq(s.outletId, outletId),
//         eq(s.isActive, true),
//         inArray(s.id, stockItemIds),
//       ),
//     columns: { id: true },
//   });

//   if (validStockItems.length !== stockItemIds.length) {
//     return {
//       success: false,
//       error:
//         "One or more ingredients are invalid or do not belong to this outlet",
//       status: 400,
//     };
//   }
//   // ── 4. validate quantities ──
//   const invalidQty = items.find((i) => i.quantity <= 0);
//   if (invalidQty) {
//     return {
//       success: false,
//       error: "All ingredient quantities must be greater than 0",
//       status: 400,
//     };
//   }
//   try {
//     // ── 5. create recipe ──
//     const [recipe] = await db
//       .insert(recipes)
//       .values({ productId, outletId })
//       .returning();

//     // ── 6. insert all recipe items ──
//     await db.insert(recipeItems).values(
//       items.map((item) => ({
//         recipeId: recipe.id,
//         stockItemId: item.stockItemId,
//         quantity: item.quantity.toFixed(3),
//       })),
//     );
//     // ── 7. fetch full recipe to return ──
//     const full = await db.query.recipes.findFirst({
//       where: (r, { eq }) => eq(r.id, recipe.id),
//       with: {
//         product: { columns: { name: true } },
//         recipeItems: {
//           with: {
//             stockItem: { columns: { id: true, name: true, unit: true } },
//           },
//         },
//       },
//     });

//     return { success: true, data: formatRecipe(full!) };
//   } catch (error) {
//     console.error("createRecipe error:", error);
//     return { success: false, error: "Failed to create recipe", status: 500 };
//   }
// }

// ------------Delete recipe---------------------------------

export async function createRecipe(
  outletId: string,
  productId: string,
  input: {
    variantId?: string | null; // ← new
    items: { stockItemId: string; quantity: number }[];
  },
): Promise<ControllerResult<ReturnType<typeof formatRecipe>>> {
  const { items, variantId } = input;

  if (items.length === 0) {
    return { success: false, error: "Recipe must have at least one ingredient", status: 400 };
  }

  const product = await db.query.products.findFirst({
    where: (p, { eq, and }) =>
      and(eq(p.id, productId), eq(p.outletId, outletId), eq(p.isActive, true)),
    columns: { id: true, name: true, hasVariants: true },
  });

  if (!product) {
    return { success: false, error: "Product not found", status: 404 };
  }

  // ── if variantId provided, verify it belongs to this product ──
  if (variantId) {
    const variant = await db.query.productVariants.findFirst({
      where: (v, { eq, and }) => and(eq(v.id, variantId), eq(v.productId, productId)),
      columns: { id: true, label: true },
    });
    if (!variant) {
      return { success: false, error: "Variant does not belong to this product", status: 400 };
    }
  }

  // ── check for an existing recipe at the SAME scope (product-level vs this specific variant) ──
  const existing = await db.query.recipes.findFirst({
    where: (r, { eq, and, isNull }) =>
      and(
        eq(r.productId, productId),
        eq(r.outletId, outletId),
        variantId ? eq(r.variantId, variantId) : isNull(r.variantId), // ← key change
      ),
    columns: { id: true },
  });

  if (existing) {
    return {
      success: false,
      error: variantId
        ? "Recipe already exists for this variant. Use update instead."
        : "Recipe already exists for this product. Use update instead.",
      status: 409,
    };
  }

  const stockItemIds = items.map((i) => i.stockItemId);
  const validStockItems = await db.query.stockItems.findMany({
    where: (s, { eq, and, inArray }) =>
      and(eq(s.outletId, outletId), eq(s.isActive, true), inArray(s.id, stockItemIds)),
    columns: { id: true },
  });

  if (validStockItems.length !== stockItemIds.length) {
    return {
      success: false,
      error: "One or more ingredients are invalid or do not belong to this outlet",
      status: 400,
    };
  }

  const invalidQty = items.find((i) => i.quantity <= 0);
  if (invalidQty) {
    return { success: false, error: "All ingredient quantities must be greater than 0", status: 400 };
  }

  try {
    const [recipe] = await db
      .insert(recipes)
      .values({
        productId,
        outletId,
        variantId: variantId ?? null, // ← new
      })
      .returning();

    await db.insert(recipeItems).values(
      items.map((item) => ({
        recipeId:    recipe.id,
        stockItemId: item.stockItemId,
        quantity:    item.quantity.toFixed(3),
      })),
    );

    const full = await db.query.recipes.findFirst({
      where: (r, { eq }) => eq(r.id, recipe.id),
      with: {
        product: { columns: { name: true } },
        variant: { columns: { id: true, label: true } }, // ← new
        recipeItems: {
          with: {
            stockItem: { columns: { id: true, name: true, unit: true } },
          },
        },
      },
    });

    return { success: true, data: formatRecipe(full!) };
  } catch (error) {
    console.error("createRecipe error:", error);
    return { success: false, error: "Failed to create recipe", status: 500 };
  }
}



// ------------------delete --------------------------------
export async function deleteRecipe(
  outletId: string,
  productId: string,
  variantId?: string | null, // ← new
): Promise<ControllerResult<null>> {
  const existing = await db.query.recipes.findFirst({
    where: (r, { eq, and, isNull }) =>
      and(
        eq(r.productId, productId),
        eq(r.outletId, outletId),
        variantId ? eq(r.variantId, variantId) : isNull(r.variantId), // ← key change
      ),
    columns: { id: true },
  });

  if (!existing) {
    return { success: false, error: "Recipe not found", status: 404 };
  }

  try {
    await db.delete(recipes).where(eq(recipes.id, existing.id));
    return { success: true, data: null };
  } catch (error) {
    console.error("deleteRecipe error:", error);
    return { success: false, error: "Failed to delete recipe", status: 500 };
  }
}
// ----------------update recipe ---------------------------
export async function updateRecipe(
  outletId: string,
  productId: string,
  input: {
    variantId?: string | null; // ← new
    items: { stockItemId: string; quantity: number }[];
  },
): Promise<ControllerResult<ReturnType<typeof formatRecipe>>> {
  const { items, variantId } = input;

  if (items.length === 0) {
    return {
      success: false,
      error: "Recipe must have at least one ingredient",
      status: 400,
    };
  }

  const existing = await db.query.recipes.findFirst({
    where: (r, { eq, and, isNull }) =>
      and(
        eq(r.productId, productId),
        eq(r.outletId, outletId),
        variantId ? eq(r.variantId, variantId) : isNull(r.variantId), // ← key change
      ),
    columns: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Recipe not found. Create one first.",
      status: 404,
    };
  }

  const stockItemIds = items.map((i) => i.stockItemId);
  const validStockItems = await db.query.stockItems.findMany({
    where: (s, { eq, and, inArray }) =>
      and(eq(s.outletId, outletId), eq(s.isActive, true), inArray(s.id, stockItemIds)),
    columns: { id: true },
  });

  if (validStockItems.length !== stockItemIds.length) {
    return {
      success: false,
      error: "One or more ingredients are invalid or do not belong to this outlet",
      status: 400,
    };
  }

  const invalidQty = items.find((i) => i.quantity <= 0);
  if (invalidQty) {
    return { success: false, error: "All ingredient quantities must be greater than 0", status: 400 };
  }

  try {
    await db.delete(recipeItems).where(eq(recipeItems.recipeId, existing.id));

    await db.insert(recipeItems).values(
      items.map((item) => ({
        recipeId:    existing.id,
        stockItemId: item.stockItemId,
        quantity:    item.quantity.toFixed(3),
      })),
    );

    await db
      .update(recipes)
      .set({ updatedAt: new Date() })
      .where(eq(recipes.id, existing.id));

    const full = await db.query.recipes.findFirst({
      where: (r, { eq }) => eq(r.id, existing.id),
      with: {
        product: { columns: { name: true } },
        variant: { columns: { id: true, label: true } }, // ← new
        recipeItems: {
          with: {
            stockItem: { columns: { id: true, name: true, unit: true } },
          },
        },
      },
    });

    return { success: true, data: formatRecipe(full!) };
  } catch (error) {
    console.error("updateRecipe error:", error);
    return { success: false, error: "Failed to update recipe", status: 500 };
  }
}
