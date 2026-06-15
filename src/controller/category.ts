import { db } from "@/db";
import { tr } from "zod/v4/locales";

export async function getCategories(outletId: string) {
  return db.query.categories.findMany({
    where: (c, { eq, and }) => and(eq(c.outletId, outletId), eq(c.isActive, true)),
    orderBy: (c, { asc }) => asc(c.sortOrder),
    columns :{
        id : true,
        name:true,
        isActive:true,
        outletId:true,
        sortOrder:true
    }
  });
}
export async function getProductByCategory(outletId: string, categoryId: string) {
  return db.query.products.findMany({
    where: (p, { eq, and }) =>
      and(
        eq(p.outletId, outletId),
        eq(p.categoryId, categoryId),
        eq(p.isActive, true)
      ),
    with: {
      category: true,
    },
  });
}