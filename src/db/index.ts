import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

// ─── Environment Validation ───────────────────────────────────────────────────

function validateEnv(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "[DB] Missing DATABASE_URL in .env.local\n" +
        "     Expected format: postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require",
    );
  }

  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error(
      `[DB] Invalid DATABASE_URL format. Got: "${url.slice(0, 20)}..."`,
    );
  }

  return url;
}

// ─── Neon Serverless Pool (supports transactions) ─────────────────────────────

const databaseUrl = validateEnv();
const pool = new Pool({ connectionString: databaseUrl });

// ─── Drizzle Instance ─────────────────────────────────────────────────────────

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

export type DB = typeof db;

// ─── Health Check ─────────────────────────────────────────────────────────────

export async function checkDbHealth(): Promise<{
  healthy: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await pool.query("SELECT 1");
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Typed Query Logger (dev only) ───────────────────────────────────────────

export function createLoggingDb() {
  if (process.env.NODE_ENV !== "development") return db;

  return drizzle(pool, {
    schema,
    logger: {
      logQuery(query, params) {
        console.log("\n[DB Query]", query);
        if (params.length) console.log("[DB Params]", params);
      },
    },
  });
}
