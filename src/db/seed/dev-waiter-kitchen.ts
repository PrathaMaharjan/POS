import { slugify } from "@/utils/slugify";
import { db } from "../index";
import { users, userOutlets, userOutletRoles } from "../schema";
import { hashPassword } from "@/lib/auth/password";
// import { slugify } from "@/lib/utils/slugify";

async function main() {
  // 1. Find the existing demo organization
  const org = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.slug, slugify("Demo Restaurant")),
  });

  if (!org) {
    throw new Error('Demo Restaurant org not found - run dev-cashier.ts first');
  }

  // 2. Find the existing demo outlet for that org
  const outlet = await db.query.outlets.findFirst({
    where: (o, { eq }) => eq(o.organizationId, org.id),
  });

  if (!outlet) {
    throw new Error('Demo outlet not found - run dev-cashier.ts first');
  }

  console.log("Found organization:", org.name, "| outlet:", outlet.name);

  // 3. Create a Waiter user
  const waiterPasswordHash = await hashPassword("waiter123");
  const [waiter] = await db
    .insert(users)
    .values({
      organizationId: org.id,
      name: "Demo Waiter",
      email: "waiter@demo.com",
      passwordHash: waiterPasswordHash,
      isOwner: false,
      emailVerified: true, // dev seed - skip email verification
    })
    .returning();

  console.log("Created waiter:", waiter.email, "password: Waiter@123");

  const waiterRole = await db.query.roles.findFirst({
    where: (r, { eq, and, isNull }) => and(eq(r.name, "Waiter"), isNull(r.organizationId)),
  });

  if (!waiterRole) {
    throw new Error('Waiter role not found - run db:seed first');
  }

  await db.insert(userOutlets).values({ userId: waiter.id, outletId: outlet.id });
  await db.insert(userOutletRoles).values({
    userId: waiter.id,
    outletId: outlet.id,
    roleId: waiterRole.id,
  });

  // 4. Create a Kitchen Crew user
  const kitchenPasswordHash = await hashPassword("kitchen123");
  const [kitchenCrew] = await db
    .insert(users)
    .values({
      organizationId: org.id,
      name: "Demo Kitchen Crew",
      email: "kitchen@demo.com",
      passwordHash: kitchenPasswordHash,
      isOwner: false,
      emailVerified: true,
    })
    .returning();

  console.log("Created kitchen crew:", kitchenCrew.email, "password: Kitchen@123");

  const kitchenRole = await db.query.roles.findFirst({
    where: (r, { eq, and, isNull }) => and(eq(r.name, "Kitchen Crew"), isNull(r.organizationId)),
  });

  if (!kitchenRole) {
    throw new Error('Kitchen Crew role not found - run db:seed first');
  }

  await db.insert(userOutlets).values({ userId: kitchenCrew.id, outletId: outlet.id });
  await db.insert(userOutletRoles).values({
    userId: kitchenCrew.id,
    outletId: outlet.id,
    roleId: kitchenRole.id,
  });

  console.log("\nDone. Test logins:");
  console.log("Waiter       -> email: waiter@demo.com, password: Waiter@123");
  console.log("Kitchen Crew -> email: kitchen@demo.com, password: Kitchen@123");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});