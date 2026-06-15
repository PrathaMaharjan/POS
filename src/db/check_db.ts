import { db } from "./index";
import { organizations, users, outlets, categories, products } from "./schema";

async function main() {
  const orgsCount = await db.select().from(organizations);
  const usersCount = await db.select().from(users);
  const outletsCount = await db.select().from(outlets);
  const categoriesCount = await db.select().from(categories);
  const productsCount = await db.select().from(products);

  console.log("Organizations count:", orgsCount.length);
  console.log("Users count:", usersCount.length);
  console.log("Outlets count:", outletsCount.length);
  console.log("Categories count:", categoriesCount.length);
  console.log("Products count:", productsCount.length);

  if (orgsCount.length > 0) {
    console.log("Organizations:", orgsCount.map(o => ({ id: o.id, name: o.name, slug: o.slug })));
  }
  if (outletsCount.length > 0) {
    console.log("Outlets:", outletsCount.map(o => ({ id: o.id, name: o.name, organizationId: o.organizationId })));
  }
  if (categoriesCount.length > 0) {
    console.log("Categories:", categoriesCount.map(c => ({ id: c.id, name: c.name, outletId: c.outletId, isActive: c.isActive })));
  }
  if (productsCount.length > 0) {
    console.log("Products:", productsCount.map(p => ({ id: p.id, name: p.name, outletId: p.outletId, categoryId: p.categoryId, isActive: p.isActive })));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
