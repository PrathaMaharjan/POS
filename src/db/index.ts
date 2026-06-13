import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import dotenv from "dotenv";
dotenv.config()

console.log(process.env.DATABASE_URL)
const sql = neon(process.env.DATABASE_URL as string);

export const db = drizzle(sql, { schema });