import { db } from "@/db";
import { orderItems, orders, outlets, payments, products, userOutlets, users } from "@/db/schema";
import { and, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";

const NEPAL_OFFSET_MS = 345 * 60 * 1000;
export interface TrendPoint {
  label: string;
  total: number;
  count: number;
}
// their existing function — correct ✅
function getNepalDayBounds(): { start: Date; end: Date } {
  const now = new Date();
  const nepalNow = new Date(now.getTime() + NEPAL_OFFSET_MS);

  const nepalStart = new Date(nepalNow);
  nepalStart.setUTCHours(0, 0, 0, 0);

  const nepalEnd = new Date(nepalNow);
  nepalEnd.setUTCHours(23, 59, 59, 999);

  return {
    start: new Date(nepalStart.getTime() - NEPAL_OFFSET_MS),
    end: new Date(nepalEnd.getTime() - NEPAL_OFFSET_MS),
  };
}

function getNepalWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const nepalNow = new Date(now.getTime() + NEPAL_OFFSET_MS);

  const nepalEnd = new Date(nepalNow);
  nepalEnd.setUTCHours(23, 59, 59, 999);

  const nepalStart = new Date(nepalNow);
  nepalStart.setUTCDate(nepalStart.getUTCDate() - 6); // last 7 days
  nepalStart.setUTCHours(0, 0, 0, 0);

  return {
    start: new Date(nepalStart.getTime() - NEPAL_OFFSET_MS),
    end: new Date(nepalEnd.getTime() - NEPAL_OFFSET_MS),
  };
}

function getNepalMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const nepalNow = new Date(now.getTime() + NEPAL_OFFSET_MS);

  const nepalEnd = new Date(nepalNow);
  nepalEnd.setUTCHours(23, 59, 59, 999);

  const nepalStart = new Date(nepalNow);
  nepalStart.setUTCDate(nepalStart.getUTCDate() - 27); // last 4 weeks
  nepalStart.setUTCHours(0, 0, 0, 0);

  return {
    start: new Date(nepalStart.getTime() - NEPAL_OFFSET_MS),
    end: new Date(nepalEnd.getTime() - NEPAL_OFFSET_MS),
  };
}

// --------------------total revenue --------------------------------------
export async function getTotalRevenue(outletId: string): Promise<number> {
  const result = await db
    .select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.outletId, outletId));
  const fixedvalue = Math.floor(Number(result[0].total ?? 0));
  return fixedvalue;
}

// -------------------------get popular item ------------------------

export async function getTopProducts(outletId: string, limit = 3) {
  const rows = await db
    .select({
      name: products.name,
      totalSold: sql<number>`SUM(${orderItems.quantity})`,
      totalRevenue: sql<string>`SUM(${orderItems.subtotal})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    // .innerJoin(products, eq(orderItems.orderId, products.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        eq(orders.outletId, outletId),
        isNotNull(orderItems.productId), // exclude deleted products
      ),
    )
    .groupBy(products.name)
    .orderBy(desc(sql`SUM(${orderItems.quantity})`))
    .limit(limit);
  return rows.map((r, index) => ({
    rank: index + 1,
    name: r.name,
    totalSold: Number(r.totalSold),
    totalRevenue: Number(r.totalRevenue),
  }));
}

// ----------------------------------sale trends -----------------------------------------------
export type TrendPeriod = "hourly" | "weekly" | "monthly";



// ------------------------------get ALl ------------------------
async function getHourlyTrend(outletId: string): Promise<TrendPoint[]> {
  const { start, end } = getNepalDayBounds();

  const rows = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM (${payments.createdAt} + INTERVAL '5 hours 45 minutes'))::int`,
      total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.outletId, outletId),
        gte(payments.createdAt, start),
        lte(payments.createdAt, end)
      )
    )
    .groupBy(
      sql`EXTRACT(HOUR FROM (${payments.createdAt} + INTERVAL '5 hours 45 minutes'))::int`
    )
    .orderBy(
      sql`EXTRACT(HOUR FROM (${payments.createdAt} + INTERVAL '5 hours 45 minutes'))::int`
    );

  return rows.map((r) => ({
    label: `${String(r.hour).padStart(2, "0")}:00`, // "08:00", "14:00"
    total: Number(r.total),
    count: Number(r.count),
  }));
}

async function getWeeklyTrend(outletId: string): Promise<TrendPoint[]> {
  const { start, end } = getNepalWeekBounds();

  const rows = await db
    .select({
      dayName: sql<string>`TRIM(TO_CHAR((${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC', 'Day'))`,
      dayDate: sql<string>`DATE((${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`,
      total:   sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      count:   sql<number>`COUNT(*)::int`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.outletId, outletId),
        gte(payments.createdAt, start),
        lte(payments.createdAt, end)
      )
    )
    .groupBy(
      sql`DATE((${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`,
      sql`TRIM(TO_CHAR((${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC', 'Day'))`
    )
    .orderBy(
      sql`DATE((${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`
    );

  return rows.map((r) => ({
    label: r.dayName, // "Monday", "Tuesday" etc.
    total: Number(r.total),
    count: Number(r.count),
  }));
}

async function getMonthlyTrend(outletId: string): Promise<TrendPoint[]> {
  const { start, end } = getNepalMonthBounds();

  const rows = await db
    .select({
      weekStart: sql<string>`DATE_TRUNC('week', (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`,
      total:     sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      count:     sql<number>`COUNT(*)::int`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.outletId, outletId),
        gte(payments.createdAt, start),
        lte(payments.createdAt, end)
      )
    )
    .groupBy(
      sql`DATE_TRUNC('week', (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`
    )
    .orderBy(
      sql`DATE_TRUNC('week', (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`
    );

  // label as "Week 1", "Week 2" etc.
  return rows.map((r, index) => ({
    label: `Week ${index + 1}`,
    total: Number(r.total),
    count: Number(r.count),
  }));

}

export async function getSalesTrend(
  outletId: string,
  period: TrendPeriod
): Promise<TrendPoint[]> {
  switch (period) {
    case "hourly":  return getHourlyTrend(outletId);
    case "weekly":  return getWeeklyTrend(outletId);
    case "monthly": return getMonthlyTrend(outletId);
  }
}

// -----------------------activeStaffList ----------------------------------
export async function getActiveStaffCount(outletId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userOutlets)
    .innerJoin(users, eq(userOutlets.userId, users.id))
    .where(
      and(
        eq(userOutlets.outletId, outletId),
        eq(users.isActive, true)
      )
    );

  return Number(result[0]?.count ?? 0);
}
// ------------------------total outlets list -----------------------------
export async function getTotalOutlets(organizationId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(outlets)
    .where(
      and(
        eq(outlets.organizationId, organizationId),
        eq(outlets.isActive, true)
      )
    );

  return Number(result[0]?.count ?? 0);
}

export async function getDashboardData(
  outletId: string,
  organizationId: string,
  period: TrendPeriod = "hourly"
) {
  const [totalRevenue, topProducts, salesTrend,activeStaff] =
    await Promise.all([
      getTotalRevenue(outletId),
      getTopProducts(outletId, 3),
      getSalesTrend(outletId, period),
      getActiveStaffCount(outletId)
    ]);

  return {
    totalRevenue,
    topProducts,
    salesTrend,
    activeStaff
  };
}