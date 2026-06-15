import { slugify } from "@/utils/slugify";
import { db } from "../index";
import { organizations, users, outlets, userOutlets, userOutletRoles, roles, categories, products } from "../schema";
import { hashPassword } from "@/lib/auth/password";
// import { slugify } from "@/lib/utils/slugify";

async function main() {
  // 1. Create a test organization
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Demo Restaurant",
      slug: slugify("Demo Restaurant"),
    })
    .returning();

  console.log("Created organization:", org.id);

  // 2. Create an owner user
  const ownerPasswordHash = await hashPassword("Owner@123");
  const [owner] = await db
    .insert(users)
    .values({
      organizationId: org.id,
      name: "Demo Owner",
      email: "owner@demo.com",
      passwordHash: ownerPasswordHash,
      isOwner: true,
      emailVerified: true, // dev seed - skip email verification
    })
    .returning();

  console.log("Created owner:", owner.email, "password: Owner@123");

  // 3. Create an outlet
  const [outlet] = await db
    .insert(outlets)
    .values({
      organizationId: org.id,
      name: "Demo Outlet - Main",
      address: "Kathmandu, Nepal",
    })
    .returning();

  console.log("Created outlet:", outlet.id);

  // 4. Link owner to outlet as Owner role
  const ownerRole = await db.query.roles.findFirst({
    where: (r, { eq, and, isNull }) => and(eq(r.name, "Owner"), isNull(r.organizationId)),
  });

  await db.insert(userOutlets).values({ userId: owner.id, outletId: outlet.id });
  if (ownerRole) {
    await db.insert(userOutletRoles).values({
      userId: owner.id,
      outletId: outlet.id,
      roleId: ownerRole.id,
    });
  }

  // 5. Create a Cashier user
  const cashierPasswordHash = await hashPassword("Cashier@123");
  const [cashier] = await db
    .insert(users)
    .values({
      organizationId: org.id,
      name: "Demo Cashier",
      email: "cashier@demo.com",
      passwordHash: cashierPasswordHash,
      isOwner: false,
      emailVerified: true, // dev seed - skip email verification
    })
    .returning();

  console.log("Created cashier:", cashier.email, "password: Cashier@123");

  // 6. Link cashier to outlet with Cashier role
  const cashierRole = await db.query.roles.findFirst({
    where: (r, { eq, and, isNull }) => and(eq(r.name, "Cashier"), isNull(r.organizationId)),
  });

  await db.insert(userOutlets).values({ userId: cashier.id, outletId: outlet.id });
  if (cashierRole) {
    await db.insert(userOutletRoles).values({
      userId: cashier.id,
      outletId: outlet.id,
      roleId: cashierRole.id,
    });
  }

  // 7. Seed categories
  const [burgersCat, drinksCat, dessertsCat] = await db
    .insert(categories)
    .values([
      { outletId: outlet.id, name: "Burgers", sortOrder: 1, isActive: true },
      { outletId: outlet.id, name: "Drinks", sortOrder: 2, isActive: true },
      { outletId: outlet.id, name: "Desserts", sortOrder: 3, isActive: true },
    ])
    .returning();

  console.log("Created categories:", burgersCat.name, drinksCat.name, dessertsCat.name);

  // 8. Seed products
  const insertedProducts = await db
    .insert(products)
    .values([
      {
        outletId: outlet.id,
        categoryId: burgersCat.id,
        name: "Classic Cheese Burger",
        description: "Juicy beef patty with melted cheddar cheese, lettuce, tomato, and secret sauce.",
        price: "250.00",
        isAvailable: true,
        isActive: true,
      },
      {
        outletId: outlet.id,
        categoryId: burgersCat.id,
        name: "Crispy Chicken Burger",
        description: "Crispy fried chicken breast, spicy mayo, and pickles.",
        price: "300.00",
        isAvailable: true,
        isActive: true,
      },
      {
        outletId: outlet.id,
        categoryId: drinksCat.id,
        name: "Coca-Cola (500ml)",
        description: "Chilled carbonated soft drink.",
        price: "80.00",
        isAvailable: true,
        isActive: true,
      },
      {
        outletId: outlet.id,
        categoryId: drinksCat.id,
        name: "Cold Coffee",
        description: "Creamy iced coffee topped with chocolate syrup.",
        price: "150.00",
        isAvailable: true,
        isActive: true,
      },
      {
        outletId: outlet.id,
        categoryId: dessertsCat.id,
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with a molten chocolate center.",
        price: "220.00",
        isAvailable: true,
        isActive: true,
      },
      {
        outletId: outlet.id,
        categoryId: dessertsCat.id,
        name: "Warm Apple Pie",
        description: "Traditional apple pie served warm.",
        price: "180.00",
        isAvailable: true,
        isActive: true,
      },
    ])
    .returning();

  console.log(`Created ${insertedProducts.length} products`);

  console.log("\nDone. Test login:");
  console.log("Cashier -> email: cashier@demo.com, password: Cashier@123");
  console.log("Owner   -> email: owner@demo.com, password: Owner@123");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});