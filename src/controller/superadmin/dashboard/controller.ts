import { db } from "@/db";
import { organizations, users } from "@/db/schema";
import { eq, gte, sql } from "drizzle-orm";

export type TrendPeriod = "7days" | "30days" | "1year";

// ─────────────────────────────────────────────
// HELPER — get date range from period
// ─────────────────────────────────────────────
function getFromDate(period: TrendPeriod): Date {
  const now = new Date();

  switch (period) {
    case "7days":
      now.setDate(now.getDate() - 7);
      return now;
    case "30days":
      now.setDate(now.getDate() - 30);
      return now;
    case "1year":
      now.setFullYear(now.getFullYear() - 1);
      return now;
  }
}

// ─────────────────────────────────────────────
// HELPER — get SQL group format based on period
// 7days  → group by day   "Mon DD" e.g. "Jun 25"
// 30days → group by week  "Week N" e.g. "Week 26"
// 1year  → group by month "Mon YYYY" e.g. "Jan 2026"
// ─────────────────────────────────────────────
// function getGroupFormat(period: TrendPeriod): string {
//   switch (period) {
//     case "7days":
//       return "Mon DD"; // daily
//     case "30days":
//       return "IYYY-IW"; // weekly (ISO week)
//     case "1year":
//       return "Mon YYYY"; // monthly
//   }
// }
function getGroupFormat(period: TrendPeriod): string {
  switch (period) {
    case "7days":
      return "FMDay"; // ← "Monday", "Tuesday" etc.
    case "30days":
      return "IYYY-IW";
    case "1year":
      return "Mon YYYY";
  }
}
// ─────────────────────────────────────────────
// HELPER — determine trend badge label
// compares first half vs second half of period
// ─────────────────────────────────────────────
function getTrendLabel(data: { count: number }[]): string {
  if (data.length < 2) return "Early data";

  const half = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, half).reduce((s, d) => s + d.count, 0);
  const lastHalf = data.slice(half).reduce((s, d) => s + d.count, 0);
  const diff = lastHalf - firstHalf;
  const pct = firstHalf > 0 ? (diff / firstHalf) * 100 : 0;

  if (pct > 20) return "Rapid growth";
  if (pct > 5) return "Steady registration volume";
  if (pct > -5) return "Stable volume";
  if (pct > -20) return "Slowing registrations";
  return "Declining registrations";
}

// -------------------------------------------------- upper stats card data ------------------------------------------------------
export async function getPlatformStats() {
  const [
    totalOrgs,
    // activeSubscriptions,
    // mrrEstimate,
    platformUsers,
  ] = await Promise.all([
    // 1. total organizations
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(organizations)
      .then((rows) => rows[0]?.count ?? 0),

    // 2. active subscriptions
    // db
    //   .select({ count: sql<number>`COUNT(*)::int` })
    //   .from(subscriptions)
    //   .where(eq(subscriptions.status, "active"))
    //   .then((rows) => rows[0]?.count ?? 0),

    // // 3. MRR — sum of all active subscription prices
    // db
    //   .select({
    //     total: sql<number>`COALESCE(SUM(price_per_month), 0)::numeric`,
    //   })
    //   .from(subscriptions)
    //   .where(eq(subscriptions.status, "active"))
    //   .then((rows) => Number(rows[0]?.total ?? 0)),

    // 4. active staff across all orgs
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(users)
      .where(eq(users.isActive, true))
      .then((rows) => rows[0]?.count ?? 0),
  ]);

  return {
    totalOrganizations: totalOrgs,
    // activeSubscriptions,
    // mrrEstimate:         Number(mrrEstimate),
    platformUsers,
  };
}
// --------------------------------------- get registration trend -------------------------------------------------------
// returns:
//   newOrgs[]     → new registrations per period bucket (blue line)
//   cumulativeOrgs[] → running total (green line)
//   trendLabel    → badge text

export async function getRegistrationTrend(period: TrendPeriod = "1year") {
  const fromDate    = getFromDate(period);
  const groupFormat = getGroupFormat(period);

  // ── new orgs per bucket ──
  const newOrgsRows = await db
    .select({
      bucket:  sql<string>`TO_CHAR(created_at, ${sql.raw(`'${groupFormat}'`)})`,
      count:   sql<number>`COUNT(*)::int`,
      minDate: sql<string>`MIN(created_at)::text`,
    })
    .from(organizations)
    .where(gte(organizations.createdAt, fromDate))
    .groupBy(sql.raw(`TO_CHAR(created_at, '${groupFormat}')`))
    .orderBy(sql.raw(`MIN(created_at) ASC`)); // ← always order by real date

  // ── baseline ──
  const baselineResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(organizations)
    .where(sql`created_at < ${fromDate}`);

  const baseline = Number(baselineResult[0]?.count ?? 0);

  // ── build cumulative ──
  let running = baseline;
  const combined = newOrgsRows.map((row) => {
    running += row.count;
    return {
      bucket:    row.bucket,    // "Monday", "Jun 25", "Jan 2026" etc.
      newOrgs:   row.count,
      totalOrgs: running,
    };
  });

  const trendLabel = getTrendLabel(newOrgsRows);

  return {
    period,
    trendLabel,
    data: combined,
  };
}
