import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*", // ← wildcard to pick up all files in the folder
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
