import { ControllerResult } from "@/controller/orderController";
import { db } from "@/db";
import { diningTables, orders, payments } from "@/db/schema";
import { eq, ne, notInArray } from "drizzle-orm";

export type PaymentMethod = "cash" | "card" | "qr";
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
    changeDue: number; // 🆕 Added to return structure to track change handed back to customer
  }>
> {
  // 1. Query the 'orders' table to find a single row matching this orderId and outletId
  const order = await db.query.orders.findFirst({
    where: (o, { eq, and }) => and(eq(o.id, orderId), eq(o.outletId, outletId)),
  });

  // 2. Guard Clause: If the order doesn't exist, exit immediately with a 404 status
  if (!order) {
    return { success: false, error: "Order not found", status: 404 };
  }

  // 3. Guard Clause: Prevent processing new payments if the order is already 'completed' or 'cancelled'
  if (order.status === "completed" || order.status === "cancelled") {
    return {
      success: false,
      error: `Cannot take payment for a ${order.status} order`,
      status: 400,
    };
  }

  // 4. Guard Clause: Validate that the incoming payment amount is a positive number
  if (amount <= 0) {
    return {
      success: false,
      error: "Payment amount must be greater than 0",
      status: 400,
    };
  }

  // 5. Cast the order total from a database string/decimal type into a standard JavaScript number
  const orderTotal = Number(order.total);

  // 6. Fetch all historical payments that have already been recorded for this specific order
  const existingPayments = await db.query.payments.findMany({
    where: (p, { eq }) => eq(p.orderId, order.id),
  });

  // 7. Calculate total money already received by converting and summing up all previous payments
  const paidSoFar = existingPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  // 8. Determine what the customer still owes right *before* this new transaction is applied (minimum 0)
  const owedBeforeThisPayment = Math.max(orderTotal - paidSoFar, 0);

  // 9. NEW (Cash Capping): If cash, don't record overpayments in the DB (e.g., if $20 is handed for a $15 bill, only record $15)
  const amountToRecord =
    method === "cash" ? Math.min(amount, owedBeforeThisPayment) : amount;

  // 10. NEW (Change Calculation): If cash, compute the change due to the customer (e.g., $20 cash - $15 bill = $5 change)
  const changeDue =
    method === "cash" ? Math.max(amount - owedBeforeThisPayment, 0) : 0;

  // 11. Wrap database operations in a try/catch block to securely isolate database or connection faults
  try {
    // 12. Write the new payment into the 'payments' table, destructuring the array to get the created record
    const [payment] = await db
      .insert(payments)
      .values({
        orderId: order.id,
        outletId,
        amount: amountToRecord.toFixed(2), // ✅ Saved as a clean 2-decimal string capped to exact amount owed
        method,
        receivedBy: userId,
      })
      .returning(); // Instructs the database engine to return the fully generated row

    // 13. Derive the new absolute total paid by combining past history with the capped value we just wrote
    const totalPaid = paidSoFar + amountToRecord;

    // 14. Redundant assignment (already declared on line 5): Re-casting order total to a number
    const orderTotal = Number(order.total);

    // 15. Compute the final remaining balance due on this order (forces 0 if fully or over-paid)
    const balanceDue = Math.max(orderTotal - totalPaid, 0);

    // 16. Initialize a tracking variable holding the original order data to dynamically alter if closed
    let updatedOrder = order;

    // 17. Check if the running payment total satisfies or exceeds the required order price tag
    if (totalPaid >= orderTotal) {
      // 18. Execute an update query to change the status of the order to 'completed' and stamp the exact execution time
      const [closed] = await db
        .update(orders)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(orders.id, order.id))
        .returning();

      // 19. Set our tracking variable to point to the newly updated database state
      updatedOrder = closed;

      // 20. If this is a dine-in restaurant order linked to a physical table entity...
      if (order.orderType === "dine_in" && order.tableId) {
        // 21. Look for any overlapping, uncompleted orders sharing this exact same physical table
        const otherActiveOrder = await db.query.orders.findFirst({
          where: (o, { eq, and }) =>
            and(
              eq(o.tableId, order.tableId!),
              ne(o.id, order.id), // Ensure we ignore the order we just closed
              notInArray(o.status, ["completed", "cancelled"]), // Looks for orders still active/unpaid
            ),
        });

        // 22. If no other active parties are seated at this table, flip its status to "available" for new guests
        if (!otherActiveOrder) {
          await db
            .update(diningTables)
            .set({ status: "available" })
            .where(eq(diningTables.id, order.tableId));
        }
      }
    }

    // 23. Return a successful object wrapper containing the new payment record, updated order details, and all financials
    return { success: true, data: { payment, order: updatedOrder, totalPaid, balanceDue, changeDue } };
  } catch (error) {
    // 24. Diagnostic fallback: Log the native database error stack on the server console for developers
    console.error("createPayment error:", error);

    // 25. Return an abstract server failure message to the front-end application to prevent sensitive log exposure
    return { success: false, error: "Failed to record payment", status: 500 };
  }
}

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
