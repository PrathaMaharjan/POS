import { db } from "@/db";
import { products } from "@/db/schema";
import { getImageUrl } from "@/lib/cloudinary/storage";
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

export function formatProduct<T extends {
  id: string;
  name: string;
  description?: string | null;
  price: string | null;
  imagePublicId: string | null;
  isActive?: boolean;
  isAvailable?: boolean;
  categoryId: string;
}>(p: T) {
  return {
    ...p,
    price: Number(p.price),
    // resolve full URL here — if provider changes, only storage.ts changes
    imageUrl: getImageUrl(p.imagePublicId, { width: 400 }),
    imagePublicId: undefined, // don't expose raw key to frontend
  };
}

export async function createProduct(
  outletId: string,
  input: {
    name: string;
    categoryId: string;
    price: number;
    description?: string;
    imagePublicId?: string;
  },
): Promise<ControllerResult<{ id: string; name: string }>> {
  try {
    const [product] = await db
      .insert(products)
      .values({
        outletId,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description ?? null,
        price: String(input.price),
        // outletId,
        // categoryId: input.categoryId,
        // name: input.name,
        // description: input.description ?? null,
        // price: String(input.price),
        imagePublicId: input.imagePublicId ?? null,
      })
      .returning({ id: products.id, name: products.name });

    return { success: true, data: product };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: `A product named "${input.name}" already exists at this outlet`,
        status: 409,
      };
    }
    console.error("createProduct error:", error);
    return { success: false, error: "Failed to create product", status: 500 };
  }
}

//----------------- delete product ----------------------------
export async function hardDeleteProduct(
  outletId: string,
  productId: string,
): Promise<ControllerResult<null>> {
  try {
    const [deleted] = await db
      .delete(products)
      .where(and(eq(products.id, productId), eq(products.outletId, outletId)))
      .returning({ id: products.id });

    if (!deleted) {
      return { success: false, error: "Product not found", status: 404 };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("hardDeleteProduct error:", error);
    return { success: false, error: "Failed to delete product", status: 500 };
  }
}

// ---------------------getProductById -----------------------------------
export async function getProductById(outletId: string, productId: string) {
  const product = await db.query.products.findFirst({
    where: (p, { eq, and }) =>
      and(eq(p.outletId, outletId), eq(p.id, productId)),
    columns: {
      id: true,
      name: true,
      description: true,
      price: true,
      imagePublicId: true,
      isActive: true,
      isAvailable: true,
      categoryId: true,
    },
  });
  if (!product) return null;
  return formatProduct(product);
}
// ------------------------------updateProduct detail -------------------------------------
export async function updateProduct(
  outletId: string,
  productId: string,
  input: {
    name?: string;
    categoryId?: string;
    price?: number;
    description?: string;
    imagePublicId?: string;
    sortOrder?: number;
  }
): Promise<ControllerResult<{ id: string }>> {
  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateValues.name = input.name;
  if (input.categoryId !== undefined) updateValues.categoryId = input.categoryId;
  if (input.price !== undefined) updateValues.price = String(input.price);
  if (input.description !== undefined) updateValues.description = input.description;
  if (input.imagePublicId !== undefined) updateValues.imagePublicId = input.imagePublicId;
  if (input.sortOrder !== undefined) updateValues.sortOrder = input.sortOrder;

  try {
    const [updated] = await db
      .update(products)
      .set(updateValues)
      .where(and(eq(products.id, productId), eq(products.outletId, outletId)))
      .returning({ id: products.id });

    if (!updated) {
      return { success: false, error: "Product not found", status: 404 };
    }

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: `A product named "${input.name}" already exists at this outlet`,
        status: 409,
      };
    }
    console.error("updateProduct error:", error);
    return { success: false, error: "Failed to update product", status: 500 };
  }
}
// --------------- update Product status ------------------------------------------
export async function updateProductStatus(
  outletId: string,
  productId: string,
  isActive: boolean,
): Promise<ControllerResult<{ id: string; isActive: boolean }>> {
  try {
    const [updated] = await db
      .update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.outletId, outletId)))
      .returning({ id: products.id, isActive: products.isActive });

    if (!updated) {
      return { success: false, error: "Product not found", status: 404 };
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("updateProductStatus error:", error);
    return {
      success: false,
      error: "Failed to update product status",
      status: 500,
    };
  }
}

// --------------------list of active product ---------------------------------
export async function listProducts(
  outletId: string,
  categoryId: string | null | undefined,
  limit: number,
  offset: number
) {
  const conditions = [
    eq(products.outletId, outletId),
    eq(products.isActive, true)
  ];
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  const [rows, totalResult] = await Promise.all([
    db.query.products.findMany({
      where: (p, { eq, and }) => {
        const conds = [
          eq(p.outletId, outletId),
          eq(p.isActive, true)
        ];
        if (categoryId) {
          conds.push(eq(p.categoryId, categoryId));
        }
        return and(...conds);
      },
      columns: {
        id: true,
        name: true,
        description: true,
        price: true,
        imagePublicId: true,
        isActive: true,
        isAvailable: true,
        categoryId: true,

      },
      orderBy: (p, { asc }) => asc(p.createdAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions)),
  ]);

  return {
    products: rows.map(formatProduct),
    total: Number(totalResult[0]?.count ?? 0),
  };
}
