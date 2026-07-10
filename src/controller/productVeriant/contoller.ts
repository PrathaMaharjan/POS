import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

// ─────────────────────────────────────────────
// HELPER — verify product exists and belongs to this outlet
// ─────────────────────────────────────────────
async function verifyProductOwnership(outletId: string, productId: string) {
  const product = await db.query.products.findFirst({
    where: (p, { eq, and }) =>
      and(eq(p.id, productId), eq(p.outletId, outletId)),
    columns: { id: true, name: true, hasVariants: true },
  });

  if (!product) {
    return { success: false as const, error: "Product not found", status: 404 };
  }

  return { success: true as const, data: product };
}

//------------------------------------ LIST VARIANTS for a product -----------------------------------------------
export async function listVariants(
  outletId: string,
  productId: string,
): Promise<ControllerResult<(typeof productVariants.$inferSelect)[]>> {
  const check = await verifyProductOwnership(outletId, productId);
  if (!check.success) return check;

  const variants = await db.query.productVariants.findMany({
    where: (v, { eq, and }) =>
      and(eq(v.productId, productId), eq(v.isActive, true)),
    orderBy: (v, { asc }) => [asc(v.sortOrder), asc(v.createdAt)],
  });

  return { success: true, data: variants };
}

export async function createVariant(
  outletId: string,
  productId: string,
  input: {
    label: string;
    price: string; // numeric column — pass as string, e.g. "100.00"
    isDefault?: boolean;
    sortOrder?: number;
  },
): Promise<ControllerResult<typeof productVariants.$inferSelect>> {
  const check = await verifyProductOwnership(outletId, productId);
  if (!check.success) return check;

  try {
    // ── if this variant is being set as default, unset any existing default first ──
    if (input.isDefault) {
      await db
        .update(productVariants)
        .set({ isDefault: false })
        .where(eq(productVariants.productId, productId));
    }
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        label: input.label,
        price: input.price,
        isDefault: input.isDefault ?? false,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();

    // ── mark the parent product as having variants now ──
    if (!check.data.hasVariants) {
      await db
        .update(products)
        .set({ hasVariants: true, updatedAt: new Date() })
        .where(eq(products.id, productId));
    }

    return { success: true, data: variant };
  } catch (error: any) {
    // unique constraint violation — duplicate label under same product
    if (error?.code === "23505") {
      return {
        success: false,
        error: `A variant named "${input.label}" already exists for this product`,
        status: 409,
      };
    }
    console.error("createVariant error:", error);
    return { success: false, error: "Failed to create variant", status: 500 };
  }
}

// UPDATE VARIANT
// ─────────────────────────────────────────────
export async function updateVariant(
  outletId:  string,
  productId: string,
  variantId: string,
  input: {
    label?:     string;
    price?:     string;
    isDefault?: boolean;
    sortOrder?: number;
    isActive?:  boolean;
  }
): Promise<ControllerResult<typeof productVariants.$inferSelect>> {
  const check = await verifyProductOwnership(outletId, productId);
  if (!check.success) return check;

  const existing = await db.query.productVariants.findFirst({
    where: (v, { eq, and }) =>
      and(eq(v.id, variantId), eq(v.productId, productId)),
  });

  if (!existing) {
    return { success: false, error: "Variant not found", status: 404 };
  }

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (input.label     !== undefined) updateValues.label     = input.label;
  if (input.price     !== undefined) updateValues.price     = input.price;
  if (input.sortOrder !== undefined) updateValues.sortOrder = input.sortOrder;
  if (input.isActive  !== undefined) updateValues.isActive  = input.isActive;

  try {
    // ── if setting this as default, unset any OTHER default for this product ──
    if (input.isDefault === true) {
      await db
        .update(productVariants)
        .set({ isDefault: false })
        .where(
          and(eq(productVariants.productId, productId), ne(productVariants.id, variantId))
        );
      updateValues.isDefault = true;
    } else if (input.isDefault === false) {
      updateValues.isDefault = false;
    }

    const [updated] = await db
      .update(productVariants)
      .set(updateValues)
      .where(eq(productVariants.id, variantId))
      .returning();

    return { success: true, data: updated };
  } catch (error: any) {
    if (error?.code === "23505") {
      return {
        success: false,
        error:  `A variant named "${input.label}" already exists for this product`,
        status: 409,
      };
    }
    console.error("updateVariant error:", error);
    return { success: false, error: "Failed to update variant", status: 500 };
  }
}

// deleyte
export async function deleteVariant(
  outletId:  string,
  productId: string,
  variantId: string
): Promise<ControllerResult<null>> {
  const check = await verifyProductOwnership(outletId, productId);
  if (!check.success) return check;

  const existing = await db.query.productVariants.findFirst({
    where: (v, { eq, and }) =>
      and(eq(v.id, variantId), eq(v.productId, productId)),
  });

  if (!existing) {
    return { success: false, error: "Variant not found", status: 404 };
  }

  try {
    await db.delete(productVariants).where(eq(productVariants.id, variantId));

    // ── check if any variants remain for this product ──
    const remaining = await db.query.productVariants.findFirst({
      where: (v, { eq }) => eq(v.productId, productId),
    });

    // no variants left → flip hasVariants back to false
    if (!remaining) {
      await db
        .update(products)
        .set({ hasVariants: false, updatedAt: new Date() })
        .where(eq(products.id, productId));
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("deleteVariant error:", error);
    return { success: false, error: "Failed to delete variant", status: 500 };
  }

}