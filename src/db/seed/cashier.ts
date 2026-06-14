import { slugify } from "@/utils/slugify";
import { db } from "../index";
import { organizations, users, outlets, userOutlets, userOutletRoles, roles } from "../schema";
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

  console.log("\nDone. Test login:");
  console.log("Cashier -> email: cashier@demo.com, password: Cashier@123");
  console.log("Owner   -> email: owner@demo.com, password: Owner@123");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});