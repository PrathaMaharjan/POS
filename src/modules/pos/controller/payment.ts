import { ControllerResult } from "@/controller/orderController";
import { db } from "@/db";
import { diningTables, orders, paymentItems, payments } from "@/db/schema";
import { and, desc, eq, gte, lte, ne, notInArray, sql } from "drizzle-orm";

export type PaymentMethod = "cash" | "card" | "qr";
// export async function createPayment(
//   outletId: string,
//   userId: string,
//   orderId: string,
//   amount: number,
//   method: PaymentMethod,
// ): Promise<
//   ControllerResult<{
//     payment: typeof payments.$inferSelect;
//     order: typeof orders.$inferSelect;
//     totalPaid: number;
//     balanceDue: number;
//     changeDue: number; 
//   }>
// > {
//   // 1. Query the 'orders' table to find a single row matching this orderId and outletId
//   const order = await db.query.orders.findFirst({
//     where: (o, { eq, and }) => and(eq(o.id, orderId), eq(o.outletId, outletId)),
//   });

//   // 2. Guard Clause: If the order doesn't exist, exit immediately with a 404 status
//   if (!order) {
//     return { success: false, error: "Order not found", status: 404 };
//   }

//   // 3. Guard Clause: Prevent processing new payments if the order is already 'completed' or 'cancelled'
//   if (order.status === "completed" || order.status === "cancelled") {
//     return {
//       success: false,
//       error: `Cannot take payment for a ${order.status} order`,
//       status: 400,
//     };
//   }

//   // 4. Guard Clause: Validate that the incoming payment amount is a positive number
//   if (amount <= 0) {
//     return {
//       success: false,
//       error: "Payment amount must be greater than 0",
//       status: 400,
//     };
//   }

//   // 5. Cast the order total from a database string/decimal type into a standard JavaScript number
//   const orderTotal = Number(order.total);

//   // 6. Fetch all historical payments that have already been recorded for this specific order
//   const existingPayments = await db.query.payments.findMany({
//     where: (p, { eq }) => eq(p.orderId, order.id),
//   });

//   // 7. Calculate total money already received by converting and summing up all previous payments
//   const paidSoFar = existingPayments.reduce(
//     (sum, p) => sum + Number(p.amount),
//     0,
//   );

//   // 8. Determine what the customer still owes right *before* this new transaction is applied (minimum 0)
//   const owedBeforeThisPayment = Math.max(orderTotal - paidSoFar, 0);

//   // 9. NEW (Cash Capping): If cash, don't record overpayments in the DB (e.g., if $20 is handed for a $15 bill, only record $15)
//   const amountToRecord =
//     method === "cash" ? Math.min(amount, owedBeforeThisPayment) : amount;

//   // 10. NEW (Change Calculation): If cash, compute the change due to the customer (e.g., $20 cash - $15 bill = $5 change)
//   const changeDue =
//     method === "cash" ? Math.max(amount - owedBeforeThisPayment, 0) : 0;

//   // 11. Wrap database operations in a try/catch block to securely isolate database or connection faults
//   try {
//     // 12. Write the new payment into the 'payments' table, destructuring the array to get the created record
//     const [payment] = await db
//       .insert(payments)
//       .values({
//         orderId: order.id,
//         outletId,
//         amount: amountToRecord.toFixed(2), // ✅ Saved as a clean 2-decimal string capped to exact amount owed
//         method,
//         receivedBy: userId,
//       })
//       .returning(); // Instructs the database engine to return the fully generated row

//     // 13. Derive the new absolute total paid by combining past history with the capped value we just wrote
//     const totalPaid = paidSoFar + amountToRecord;

//     // 14. Redundant assignment (already declared on line 5): Re-casting order total to a number
//     const orderTotal = Number(order.total);

//     // 15. Compute the final remaining balance due on this order (forces 0 if fully or over-paid)
//     const balanceDue = Math.max(orderTotal - totalPaid, 0);

//     // 16. Initialize a tracking variable holding the original order data to dynamically alter if closed
//     let updatedOrder = order;

//     // 17. Check if the running payment total satisfies or exceeds the required order price tag
//     if (totalPaid >= orderTotal) {
//       // 18. Execute an update query to change the status of the order to 'completed' and stamp the exact execution time
//       const [closed] = await db
//         .update(orders)
//         .set({ status: "completed", updatedAt: new Date() })
//         .where(eq(orders.id, order.id))
//         .returning();

//       // 19. Set our tracking variable to point to the newly updated database state
//       updatedOrder = closed;

//       // 20. If this is a dine-in restaurant order linked to a physical table entity...
//       if (order.orderType === "dine_in" && order.tableId) {
//         // 21. Look for any overlapping, uncompleted orders sharing this exact same physical table
//         const otherActiveOrder = await db.query.orders.findFirst({
//           where: (o, { eq, and }) =>
//             and(
//               eq(o.tableId, order.tableId!),
//               ne(o.id, order.id), // Ensure we ignore the order we just closed
//               notInArray(o.status, ["completed", "cancelled"]), // Looks for orders still active/unpaid
//             ),
//         });

//         // 22. If no other active parties are seated at this table, flip its status to "available" for new guests
//         if (!otherActiveOrder) {
//           await db
//             .update(diningTables)
//             .set({ status: "available" })
//             .where(eq(diningTables.id, order.tableId));
//         }
//       }
//     }

//     // 23. Return a successful object wrapper containing the new payment record, updated order details, and all financials
//     return { success: true, data: { payment, order: updatedOrder, totalPaid, balanceDue, changeDue } };
//   } catch (error) {
//     // 24. Diagnostic fallback: Log the native database error stack on the server console for developers
//     console.error("createPayment error:", error);

//     // 25. Return an abstract server failure message to the front-end application to prevent sensitive log exposure
//     return { success: false, error: "Failed to record payment", status: 500 };
//   }
// }


export async function listPaymentsForOrder(outletId: string, orderId: string) {
  const order = await db.query.orders.findFirst({
    where: (o, { eq, and }) => and(eq(o.id, orderId), eq(o.outletId, outletId)),
  });

  if (!order) {
    return { success: false, error: "Order not found", status: 404 } as const;
  }

  const paymentList = await db.query.payments.findMany({
    where: (p, { eq }) => eq(p.orderId, orderId),
    orderBy: (p, { asc }) => asc(p.createdAt),
  });

  const totalPaid = paymentList.reduce((sum, p) => sum + Number(p.amount), 0);
  const balanceDue = Math.max(Number(order.total) - totalPaid, 0);

  return {
    success: true,
    data: {
      payments: paymentList,
      totalPaid,
      balanceDue,
      orderTotal: Number(order.total),
    },
  } as const;
}

// NEPAL TIMEZONE HELPER (UTC+5:45) 
const NEPAL_OFFSET_MS = 345 * 60 * 1000;

function getNepalDayBounds(dateStr?: string): { start: Date; end: Date; date: string } {
  let nepalNow: Date;

  if (dateStr) {
    nepalNow = new Date(`${dateStr}T00:00:00.000Z`);
  } else {
    const now = new Date();
    nepalNow = new Date(now.getTime() + NEPAL_OFFSET_MS);
  }

  const nepalStart = new Date(nepalNow);
  nepalStart.setUTCHours(0, 0, 0, 0);

  const nepalEnd = new Date(nepalNow);
  nepalEnd.setUTCHours(23, 59, 59, 999);

  // extract YYYY-MM-DD from nepalNow (already shifted to Nepal time)
  const date = nepalNow.toISOString().split("T")[0];

  return {
    start: new Date(nepalStart.getTime() - NEPAL_OFFSET_MS),
    end: new Date(nepalEnd.getTime() - NEPAL_OFFSET_MS),
    date, // "2026-04-17"
  };
}


export async function getPaymentHistory(
  outletId: string,
  limit: number,
  offset: number,
  dateStr?: string
) {
  const dateFilter = dateStr ? getNepalDayBounds(dateStr) : null;

  const whereConditions = [
    eq(payments.outletId, outletId),
    ...(dateFilter
      ? [
          gte(payments.createdAt, dateFilter.start),
          lte(payments.createdAt, dateFilter.end),
        ]
      : []),
  ];

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: payments.id,
        method: payments.method,
        amount: payments.amount,
        createdAt: payments.createdAt,
        orderId: payments.orderId,
        orderNumber: orders.orderNumber,
        orderType: orders.orderType,
        tableNumber: diningTables.tableNumber, // ← added
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .leftJoin(diningTables, eq(orders.tableId, diningTables.id)) // ← LEFT JOIN so takeaway orders still appear
      .where(and(...whereConditions))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(payments)
      .where(and(...whereConditions)),
  ]);

  return {
    payments: rows.map((p) => ({
    ...p,
    amount: Number(p.amount),
    tableNumber: p.tableNumber ?? null,

    // ── ADD THESE TWO ──

    // 1. Nepal date only "2026-04-17"
    date: new Date(
      new Date(p.createdAt).getTime() + NEPAL_OFFSET_MS
    ).toISOString().split("T")[0],

    // 2. Nepal full datetime "2026-04-17 14:30:25"
    createdAtNepal: new Date(
      new Date(p.createdAt).getTime() + NEPAL_OFFSET_MS
    ).toISOString().replace("T", " ").split(".")[0],
  })),
    total: Number(totalResult[0]?.count ?? 0),
  };
}


// --------------------------------- TODAY'S REVENUE + PAYMENT BREAKDOWN BY METHOD -----------------------------------------------
export async function getDailyReport(outletId: string, dateStr?: string) {
  const { start, end } = getNepalDayBounds(dateStr);

  const [revenueResult, breakdownResult, orderCountResult] = await Promise.all([
    // total revenue for the day
    db
      .select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(
        and(
          eq(payments.outletId, outletId),
          gte(payments.createdAt, start),
          lte(payments.createdAt, end)
        )
      ),

    // breakdown by payment method
    db
      .select({
        method: payments.method,
        total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.outletId, outletId),
          gte(payments.createdAt, start),
          lte(payments.createdAt, end)
        )
      )
      .groupBy(payments.method),

    // total order count for the day
    db
      .select({ count: sql<number>`COUNT(DISTINCT ${orders.id})` })
      .from(orders)
      .innerJoin(payments, eq(payments.orderId, orders.id))
      .where(
        and(
          eq(orders.outletId, outletId),
          gte(payments.createdAt, start),
          lte(payments.createdAt, end)
        )
      ),
  ]);

  // build breakdown with all three methods always present
  const methodMap: Record<string, { total: number; count: number }> = {
    cash: { total: 0, count: 0 },
    card: { total: 0, count: 0 },
    qr: { total: 0, count: 0 },
  };

  breakdownResult.forEach((row) => {
    methodMap[row.method] = {
      total: Number(row.total),
      count: Number(row.count),
    };
  });

  return {
    date: dateStr ?? new Date(Date.now() + NEPAL_OFFSET_MS).toISOString().split("T")[0],
    totalRevenue: Number(revenueResult[0]?.total ?? 0),
    totalOrders: Number(orderCountResult[0]?.count ?? 0),
    breakdown: {
      cash: methodMap.cash,
      card: methodMap.card,
      qr: methodMap.qr,
    },
  };
}

// -------------filter payment based on payment method --------------------------
export async function getFilteredPaymentHistory(
  outletId: string,
  limit: number,
  offset: number,
  method?: PaymentMethod
) {
  const conditions = [
    eq(payments.outletId, outletId),
    ...(method ? [eq(payments.method, method)] : []),
  ];

  const [rows, totalResult, summaryResult] = await Promise.all([
    db
      .select({
        id:          payments.id,
        method:      payments.method,
        amount:      payments.amount,
        createdAt:   payments.createdAt,
        orderId:     payments.orderId,
        orderNumber: orders.orderNumber,
        orderType:   orders.orderType,
        tableNumber: diningTables.tableNumber,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .leftJoin(diningTables, eq(orders.tableId, diningTables.id))
      .where(and(...conditions))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(payments)
      .where(and(...conditions)),

    db
      .select({
        totalAmount: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(and(...conditions)),
  ]);

  return {
    payments: rows.map((p) => ({
      ...p,
      amount:    Number(p.amount),
      tableNumber: p.tableNumber ?? null,
      createdAtNepal: new Date(new Date(p.createdAt).getTime() + NEPAL_OFFSET_MS)
        .toISOString()
        .replace("T", " ")
        .split(".")[0],
    })),
    total:       Number(totalResult[0]?.count ?? 0),
    totalAmount: Number(summaryResult[0]?.totalAmount ?? 0),
  };
}

//------------------ payment for takeaways -------------------------------------

export async function createPayment(
  outletId: string,
  userId: string,
  orderId: string,
  amount: number,
  method: PaymentMethod,
): Promise<
  ControllerResult<{
    payment: typeof payments.$inferSelect;
    order: typeof orders.$inferSelect;
    totalPaid: number;
    balanceDue: number;
    changeDue: number;
  }>
> {
  // 1. Fetch order and existing payments in parallel
  const [order, existingPayments] = await Promise.all([
    db.query.orders.findFirst({
      where: (o, { eq, and }) =>
        and(eq(o.id, orderId), eq(o.outletId, outletId)),
    }),
    db.query.payments.findMany({
      where: (p, { eq }) => eq(p.orderId, orderId),
      columns: {
        amount: true,
      },
    }),
  ]);

  // 2. Validate request
  if (!order) {
    return {
      success: false,
      error: "Order not found",
      status: 404,
    };
  }

  if (order.status === "completed" || order.status === "cancelled") {
    return {
      success: false,
      error: `Cannot take payment for a ${order.status} order`,
      status: 400,
    };
  }

  if (amount <= 0) {
    return {
      success: false,
      error: "Payment amount must be greater than 0",
      status: 400,
    };
  }

  // 3. Calculate payment amounts
  const orderTotal = Number(order.total);

  const paidSoFar = existingPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const owedBeforeThisPayment = Math.max(orderTotal - paidSoFar, 0);

  const amountToRecord =
    method === "cash"
      ? Math.min(amount, owedBeforeThisPayment)
      : amount;

  const changeDue =
    method === "cash"
      ? Math.max(amount - owedBeforeThisPayment, 0)
      : 0;

  const totalPaid = paidSoFar + amountToRecord;

  const balanceDue = Math.max(orderTotal - totalPaid, 0);

  try {
    // 4. Record payment
    const [payment] = await db
      .insert(payments)
      .values({
        orderId: order.id,
        outletId,
        amount: amountToRecord.toFixed(2),
        method,
        receivedBy: userId,
      })
      .returning();

    let updatedOrder = order;

    // 5. Complete order if fully paid
    if (totalPaid >= orderTotal) {
      const [closedOrder] = await db
        .update(orders)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))
        .returning();

      updatedOrder = closedOrder;

      // Free the table if this is the last active dine-in order
      if (order.orderType === "dine_in" && order.tableId) {
        const tableId = order.tableId;

        db.query.orders
          .findFirst({
            where: (o, { eq, and }) =>
              and(
                eq(o.tableId, tableId),
                ne(o.id, order.id),
                notInArray(o.status, ["completed", "cancelled"]),
              ),
            columns: {
              id: true,
            },
          })
          .then(async (otherActiveOrder) => {
            if (!otherActiveOrder) {
              await db
                .update(diningTables)
                .set({
                  status: "available",
                })
                .where(eq(diningTables.id, tableId));
            }
          })
          .catch((err) => {
            console.error("freeTable error:", err);
          });
      }
    }

    return {
      success: true,
      data: {
        payment,
        order: updatedOrder,
        totalPaid,
        balanceDue,
        changeDue,
      },
    };
  } catch (error) {
    console.error("createPayment error:", error);

    return {
      success: false,
      error: "Failed to record payment",
      status: 500,
    };
  }
}



export async function createPartialPayment(
  outletId: string,
  orderId: string,
  userId: string,
  input: {
    method: PaymentMethod;
    items: { orderItemId: string; quantity: number }[]; // which units, how many
    amountTendered: number;
  }
): Promise<ControllerResult<{
  payment: typeof payments.$inferSelect;
  orderFullyPaid: boolean;
  changeDue: number;
}>> {

  const order = await db.query.orders.findFirst({
    where: (o, { eq, and }) => and(eq(o.id, orderId), eq(o.outletId, outletId)),
    columns: { id: true, status: true, total: true, taxRate: true },
    with: {
      items: {
        columns: { id: true, quantity: true, unitPrice: true, productId: true },
      },
    },
  });

  if (!order) {
    return { success: false, error: "Order not found", status: 404 };
  }

  if (order.status === "completed") {
    return { success: false, error: "This order is already fully paid", status: 400 };
  }

  // ── fetch already-paid quantities for EVERY item on this order ──
  const existingPaymentItems = await db.query.paymentItems.findMany({
    where: (pi, { inArray }) => inArray(pi.orderItemId, order.items.map((i) => i.id)),
  });

  const paidQtyMap = new Map<string, number>();
  for (const pi of existingPaymentItems) {
    paidQtyMap.set(pi.orderItemId, (paidQtyMap.get(pi.orderItemId) ?? 0) + pi.quantity);
  }

  // ── validate: requested quantity doesn't exceed what's left unpaid ──
  let amountDue = 0;

  for (const reqItem of input.items) {
    const orderItem = order.items.find((i) => i.id === reqItem.orderItemId);
    if (!orderItem) {
      return { success: false, error: "Item does not belong to this order", status: 400 };
    }

    const alreadyPaid = paidQtyMap.get(orderItem.id) ?? 0;
    const remaining   = orderItem.quantity - alreadyPaid;

    if (reqItem.quantity > remaining) {
      return {
        success: false,
        error: `Only ${remaining} unpaid unit(s) remaining for this item`,
        status: 400,
      };
    }

    amountDue += Number(orderItem.unitPrice) * reqItem.quantity;
  }

  // ── apply proportional tax to just this partial payment ──
  const taxRate  = Number(order.taxRate ?? 0);
  const taxOnThis = parseFloat(((amountDue * taxRate) / 100).toFixed(2));
  const totalDue  = parseFloat((amountDue + taxOnThis).toFixed(2));

  if (input.amountTendered < totalDue) {
    return {
      success: false,
      error: `Insufficient payment. Required: Rs.${totalDue.toFixed(2)}, received: Rs.${input.amountTendered.toFixed(2)}`,
      status: 400,
    };
  }

  const changeDue = input.method === "cash" ? input.amountTendered - totalDue : 0;

  try {
    const [payment] = await db
      .insert(payments)
      .values({
        orderId,
        outletId,
        method:     input.method,
        amount:     totalDue.toFixed(2),
        receivedBy: userId,
      })
      .returning();

    await db.insert(paymentItems).values(
      input.items.map((item) => ({
        paymentId:   payment.id,
        orderItemId: item.orderItemId,
        quantity:    item.quantity,
      }))
    );

    // ── check if EVERY item on the order is now fully paid ──
    const allPaymentItems = [
      ...existingPaymentItems,
      ...input.items.map((i) => ({ orderItemId: i.orderItemId, quantity: i.quantity })),
    ];

    const fullyPaidMap = new Map<string, number>();
    for (const pi of allPaymentItems) {
      fullyPaidMap.set(pi.orderItemId, (fullyPaidMap.get(pi.orderItemId) ?? 0) + pi.quantity);
    }

    const orderFullyPaid = order.items.every(
      (item) => (fullyPaidMap.get(item.id) ?? 0) >= item.quantity
    );

    if (orderFullyPaid) {
      await db
        .update(orders)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    }

    return {
      success: true,
      data: { payment, orderFullyPaid, changeDue: Number(changeDue.toFixed(2)) },
    };
  } catch (error) {
    console.error("createPartialPayment error:", error);
    return { success: false, error: "Failed to process payment", status: 500 };
  }
}