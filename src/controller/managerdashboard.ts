import { db } from "@/db";
import { orderItems, orders, payments, products } from "@/db/schema";
import { and, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";

const NEPAL_OFFSET_MS = 345 * 60 * 1000;

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

export async function getSalesTrend(
  outletId: string,
  period: TrendPeriod = "hourly",
) {
  let now = new Date();
  const nepalNow = new Date(now.getTime() + NEPAL_OFFSET_MS);

  let start: Date;
  let end: Date;
  let groupExpr: ReturnType<typeof sql>;
  let labelExpr: ReturnType<typeof sql>;

  if (period === "hourly") {
    const dayStart = new Date(nepalNow);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(nepalNow);
    dayEnd.setUTCHours(23, 59, 59, 999);

    start = new Date(dayStart.getTime() - NEPAL_OFFSET_MS);
    end = new Date(dayEnd.getTime() - NEPAL_OFFSET_MS);

    groupExpr = sql`EXTRACT(HOUR FROM (${payments.createdAt} + INTERVAL '5 hours 45 minutes'))::int`;
    labelExpr = sql`LPAD(EXTRACT(HOUR FROM (${payments.createdAt} + INTERVAL '5 hours 45 minutes'))::text, 2, '0') || ':00'`;
  } else if (period == "weekly") {
    const weekAgo = new Date(nepalNow);
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
    weekAgo.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(nepalNow);
    dayEnd.setUTCHours(23, 59, 59, 999);

    start = new Date(weekAgo.getTime() - NEPAL_OFFSET_MS);
    end = new Date(dayEnd.getTime() - NEPAL_OFFSET_MS);

    // DATE in Nepal time
    groupExpr = sql`DATE((${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`;
    labelExpr = sql`TO_CHAR((${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC', 'Mon DD')`;
  } else {
    // monthly — last 4 weeks — group by week number (Nepal time)
    const monthAgo = new Date(nepalNow);
    monthAgo.setUTCDate(monthAgo.getUTCDate() - 27); // 4 weeks = 28 days
    monthAgo.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(nepalNow);
    dayEnd.setUTCHours(23, 59, 59, 999);

    start = new Date(monthAgo.getTime() - NEPAL_OFFSET_MS);
    end = new Date(dayEnd.getTime() - NEPAL_OFFSET_MS);

    // week start date (Monday) in Nepal time
    groupExpr = sql`DATE_TRUNC('week', (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`;
    labelExpr = sql`'Week of ' || TO_CHAR(DATE_TRUNC('week', (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC'), 'Mon DD')`;
  }

  const rows = await db
    .select({
      label: labelExpr,
      groupKey: groupExpr,
      total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.outletId, outletId),
        gte(payments.createdAt, start),
        lte(payments.createdAt, end),
      ),
    )
    .groupBy(groupExpr, labelExpr)
    .orderBy(groupExpr);

  return rows.map((r) => ({
    label: String(r.label),
    total: Number(r.total),
    count: Number(r.count),
  }));
}

// ------------------------------get ALl ------------------------
export async function getDashboardData(
  outletId: string,
  organizationId: string,
  period: TrendPeriod = "hourly",
) {
  const [totalRevenue, topProducts, salesTrend] = await Promise.all([
    getTotalRevenue(outletId),
    getTopProducts(outletId, 3),
    getSalesTrend(outletId, period),
  ]);
    return {
    totalRevenue,
    topProducts,
    salesTrend,
  };
}
