import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db  = drizzle(sql, { schema });

async function seedSuperAdmin() {
  const email    = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name     = process.env.SUPER_ADMIN_NAME ?? "Technical Team";

  // ── validate env vars ──
  if (!email || !password) {
    console.error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  if (!process.env.SUPER_ADMIN_JWT_SECRET) {
    console.error("SUPER_ADMIN_JWT_SECRET must be set in .env");
    process.exit(1);
  }

  console.log("Seeding Super Admin...");

  // ── check if already exists ──
  const existing = await db.query.superAdmins.findFirst({
    where: (sa, { eq }) => eq(sa.email, email),
  });

  if (existing) {
    console.log(`Super Admin already exists: ${email}`);
    process.exit(0);
  }

  // ── hash password ──
  const passwordHash = await bcrypt.hash(password, 12);

  // ── create super admin ──
  const [superAdmin] = await db
    .insert(schema.superAdmins)
    .values({
      name,
      email,
      passwordHash,
    })
    .returning({ id: schema.superAdmins.id, email: schema.superAdmins.email });

  console.log(" Super Admin created successfully:");
  console.log(`   Email:    ${superAdmin.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Login at: /admin/login`);
  console.log("\nChange the password after first login!");

  process.exit(0);
}

seedSuperAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});