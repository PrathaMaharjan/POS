import { db } from "@/db";
import {
  categories,
  orderItems,
  orders,
  payments,
  products,
  userOutlets,
  users,
} from "@/db/schema";
import { and, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";

// --------------------------NEPAL TIMEZONE (UTC+5:45)--------------------------------------
const NEPAL_OFFSET_MS = 345 * 60 * 1000;

type Period = "7d" | "30d" | "90d";

export function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const nepalNow = new Date(now.getTime() + NEPAL_OFFSET_MS);

  const end = new Date(nepalNow);
  end.setUTCHours(23, 59, 59, 999);

  const start = new Date(nepalNow);

  switch (period) {
    case "7d":
      start.setUTCDate(start.getUTCDate() - 6);
      break;
    case "30d":
      start.setUTCDate(start.getUTCDate() - 29);
      break;
    case "90d":
      start.setUTCDate(start.getUTCDate() - 89);
      break;
  }
  start.setUTCHours(0, 0, 0, 0);

  return {
    start: new Date(start.getTime() - NEPAL_OFFSET_MS),
    end: new Date(end.getTime() - NEPAL_OFFSET_MS),
  };
}
// BUILD WHERE CONDITIONS
// outletId = null → all outlets in org
// outletId = string → specific outlet only
// ─────────────────────────────────────────────




function buildPaymentConditions(
  organizationId: string,
  outletId: string | null,
  start: Date,
  end: Date
) {
  const base = outletId
    ? and(
        eq(payments.outletId, outletId),
        gte(payments.createdAt, start),
        lte(payments.createdAt, end)
      )
    : and(
        // join through orders to filter by org
        gte(payments.createdAt, start),
        lte(payments.createdAt, end)
      );
  return base;
}

// -------------------------------SUMMARY METRICS---------------------------------------
export async function getSummaryMetrics(
  organizationId: string,
  outletId: string | null,
  start: Date,
  end: Date,
) {
  try {
    const outletFilter = outletId
      ? eq(orders.outletId, outletId)
      : sql`${orders.outletId} IN (
        SELECT id FROM outlets WHERE organization_id = ${organizationId}
      )`;
    const paymentFilter = outletId
      ? and(
          eq(payments.outletId, outletId),
          gte(payments.createdAt, start),
          lte(payments.createdAt, end),
        )
      : and(
          sql`${payments.outletId} IN (SELECT id FROM outlets WHERE organization_id = ${organizationId})`,
          gte(payments.createdAt, start),
          lte(payments.createdAt, end),
        );
    const [revenueResult, orderResult, staffResult] = await Promise.all([
      // net revenue + order count
      db
        .select({
          totalRevenue: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
          totalOrders: sql<number>`COUNT(DISTINCT ${payments.orderId})`,
        })
        .from(payments)
        .where(paymentFilter),

      // average order value
      db
        .select({
          avgOrderValue: sql<string>`COALESCE(AVG(${orders.total}), 0)`,
        })
        .from(orders)
        .where(
          and(
            outletFilter,
            gte(orders.createdAt, start),
            lte(orders.createdAt, end),
          ),
        ),
      db
        .select({ count: sql<number>`COUNT(DISTINCT ${userOutlets.userId})` })
        .from(userOutlets)
        .innerJoin(
          users,
          and(eq(userOutlets.userId, users.id), eq(users.isActive, true)),
        )
        .where(
          outletId
            ? eq(userOutlets.outletId, outletId)
            : sql`${userOutlets.outletId} IN (SELECT id FROM outlets WHERE organization_id = ${organizationId})`,
        ),
    ]);

    const totalRevenue = Number(revenueResult[0]?.totalRevenue ?? 0);
    const totalOrders = Number(revenueResult[0]?.totalOrders ?? 0);
    const avgOrderValue = Number(orderResult[0]?.avgOrderValue ?? 0);
    const activeStaff = Number(staffResult[0]?.count ?? 0);

    return { totalRevenue, totalOrders, avgOrderValue, activeStaff };
  } catch (error) {
    console.log(error);
  }
}

// ----------------------------------Popular menu items-------------------------------------
export async function getPopularMenuItems(
  organizationId: string,
  outletId: string | null,
  start: Date,
  end: Date,
  limit = 5,
) {
  const outletCondition = outletId
    ? eq(orders.outletId, outletId)
    : sql`${orders.outletId} IN (SELECT id FROM outlets WHERE organization_id = ${organizationId})`;
  const rows = await db
    .select({
      name: products.name,
      categoryName: categories.name,
      totalSold: sql<number>`SUM(${orderItems.quantity})::int`,
      grossSales: sql<string>`COALESCE(SUM(${orderItems.subtotal}), 0)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        outletCondition,
        isNotNull(orderItems.productId),
        gte(orders.createdAt, start),
        lte(orders.createdAt, end),
      ),
    )
    .groupBy(products.name, categories.name)
    .orderBy(desc(sql`SUM(${orderItems.quantity})`))
    .limit(limit);
  return rows.map((r) => ({
    name: r.name,
    categoryName: r.categoryName,
    totalSold: Number(r.totalSold),
    grossSales: Number(r.grossSales),
  }));
}

// -----------------------------------------PAYMENT GATEWAY SHARE--------------------------------------
export async function getPaymentGatewayShare(
  organizationId: string,
  outletId: string | null,
  start: Date,
  end: Date,
) {
  const outletCondition = outletId
    ? eq(payments.outletId, outletId)
    : sql`${payments.outletId} IN (SELECT id FROM outlets WHERE organization_id = ${organizationId})`;
  const rows = await db
    .select({
      method: payments.method,
      total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(payments)
    .where(
      and(
        outletCondition,
        gte(payments.createdAt, start),
        lte(payments.createdAt, end),
      ),
    )
    .groupBy(payments.method);
  const totalRevenue = rows.reduce((s, r) => s + Number(r.total), 0) || 1;

  // ensure all three methods always present
  const methodMap: Record<
    string,
    { total: number; count: number; percentage: number }
  > = {
    cash: { total: 0, count: 0, percentage: 0 },
    card: { total: 0, count: 0, percentage: 0 },
    qr: { total: 0, count: 0, percentage: 0 },
  };

  rows.forEach((r) => {
    const total = Number(r.total);
    methodMap[r.method] = {
      total,
      count: Number(r.count),
      percentage: Math.round((total / totalRevenue) * 100),
    };
  });

  return {
    netSettledAmount: totalRevenue,
    breakdown: methodMap,
  };
}

// -------------------------------- get staff ledear board -----------------------------------------------
export async function getStaffLeaderboard(
  organizationId: string,
  outletId: string | null,
  start: Date,
  end: Date,
  limit = 3,
) {
  const outletCondition = outletId
    ? eq(orders.outletId, outletId)
    : sql`${orders.outletId} IN (SELECT id FROM outlets WHERE organization_id = ${organizationId})`;
  const rows = await db
    .select({
      staffName: users.name,
      totalOrders: sql<number>`COUNT(DISTINCT ${orders.id})::int`,
      totalVolume: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(orders)
    .innerJoin(payments, eq(payments.orderId, orders.id))
    .innerJoin(users, eq(orders.createdBy, users.id))
    .where(
      and(
        outletCondition,
        gte(orders.createdAt, start),
        lte(orders.createdAt, end),
      ),
    )
    .groupBy(users.name)
    .orderBy(desc(sql`SUM(${payments.amount})`))
    .limit(limit);
  return rows.map((r, index) => ({
    rank: index + 1,
    staffName: r.staffName,
    totalOrders: Number(r.totalOrders),
    totalVolume: Number(r.totalVolume),
  }));
}

// ─────────────────────────────────────────────
// 2. SALES TREND (line chart)
// ─────────────────────────────────────────────
export async function getSalesTrend(
  organizationId: string,
  outletId: string | null,
  period: Period,
  start: Date,
  end: Date
) {
  const outletCondition = outletId
    ? eq(payments.outletId, outletId)
    : sql`${payments.outletId} IN (SELECT id FROM outlets WHERE organization_id = ${organizationId})`;

  const groupExpr =
    period === "90d"
      ? sql`DATE_TRUNC('month', (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`
      : period === "30d"
      ? sql`DATE_TRUNC('week',  (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`
      : sql`DATE(             (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC')`;

  const labelExpr =
    period === "90d"
      ? sql`TO_CHAR(DATE_TRUNC('month', (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC'), 'Mon YYYY')`
      : period === "30d"
      ? sql`TO_CHAR(DATE_TRUNC('week',  (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC'), 'Mon DD')`
      : sql`TRIM(TO_CHAR(              (${payments.createdAt} + INTERVAL '5 hours 45 minutes') AT TIME ZONE 'UTC', 'Day'))`;

   const rows = await db
    .select({
      label:    labelExpr,
      groupKey: groupExpr,
      total:    sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      count:    sql<number>`COUNT(*)::int`,
    })
    .from(payments)
    .where(
      and(
        outletCondition,
        gte(payments.createdAt, start),
        lte(payments.createdAt, end)
      )
    )
    .groupBy(groupExpr, labelExpr)
    .orderBy(groupExpr);

  return rows.map((r) => ({
    label: String(r.label).trim(),
    total: Number(r.total),
    count: Number(r.count),
  }));
}

//-------------------------------- send all value --------------------------------
export async function getOrgReports(
  organizationId: string,
  outletId: string | null, // null = all branches combined
  period: Period
) {
  const { start, end } = getDateRange(period);

  const [
    summary,
    salesTrend,
    paymentShare,
    popularItems,
    leaderboard,
  ] = await Promise.all([
    getSummaryMetrics(organizationId, outletId, start, end),
    getSalesTrend(organizationId, outletId, period, start, end),
    getPaymentGatewayShare(organizationId, outletId, start, end),
    getPopularMenuItems(organizationId, outletId, start, end),
    getStaffLeaderboard(organizationId, outletId, start, end),
  ]);

  return {
    period,
    outletId,
    summary,
    salesTrend,
    paymentShare,
    popularItems,
    leaderboard,
  };
}