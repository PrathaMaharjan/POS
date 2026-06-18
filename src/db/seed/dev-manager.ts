import { slugify } from "@/utils/slugify";
import { db } from "..";
import { userOutletRoles, userOutlets, users } from "../schema";
import { hashPassword } from "@/lib/auth/password";

async function main() {
  const org = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.slug, slugify("Demo Restaurant")),
  });

  if (!org) {
    throw new Error("Demo Restaurant org not found - run dev-cashier.ts first");
  }

  // 2. Find the existing demo outlet for that org
  const outlet = await db.query.outlets.findFirst({
    where: (o, { eq }) => eq(o.organizationId, org.id),
  });

  if (!outlet) {
    throw new Error("Demo outlet not found - run dev-cashier.ts first");
  }
  console.log("Found organization:", org.name, "| outlet:", outlet.name);
  //   create manager
  const managerPasswordHash = await hashPassword("Manager@123");
  const [manager] = await db
    .insert(users)
    .values({
      organizationId: org.id,
      name: "Demo Manager",
      email: "manager@demo.com",
      passwordHash: managerPasswordHash,
      isOwner: false,
      emailVerified: true, // dev seed - skip email verification
    })
    .returning();

  console.log("Created manager:", manager.email, "password: Manager@123");
  // 4. Link manager to outlet with Manager role
  const managerRole = await db.query.roles.findFirst({
    where: (r, { eq, and, isNull }) =>
      and(eq(r.name, "Manager"), isNull(r.organizationId)),
  });

  if (!managerRole) {
    throw new Error("Manager role not found - run db:seed first");
  }

  await db
    .insert(userOutlets)
    .values({ userId: manager.id, outletId: outlet.id });
  await db.insert(userOutletRoles).values({
    userId: manager.id,
    outletId: outlet.id,
    roleId: managerRole.id,
  });

  console.log("\nDone. Test login:");
  console.log("Manager -> email: manager@demo.com, password: Manager@123");

  process.exit(0);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});