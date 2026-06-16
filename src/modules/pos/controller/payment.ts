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
  method: PaymentMethod
): Promise<ControllerResult<{ payment: typeof payments.$inferSelect; order: typeof orders.$inferSelect; totalPaid: number; balanceDue: number }>> {
  console.log("hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii")
  console.log(amount,method)
  // 1. Fetch the order from the database that matches both the given orderId and outletId
  const order = await db.query.orders.findFirst({
    where: (o, { eq, and }) => and(eq(o.id, orderId), eq(o.outletId, outletId)),
  });

  // 2. Guard Clause: If no order is found, stop execution and return a 404 error
  if (!order) {
    return { success: false, error: "Order not found", status: 404 };
  }

  // 3. Guard Clause: If the order is already completed or cancelled, prevent taking new payments (400 Bad Request)
  if (order.status === "completed" || order.status === "cancelled") {
    return { success: false, error: `Cannot take payment for a ${order.status} order`, status: 400 };
  }

  // 4. Guard Clause: Ensure the payment amount being processed is a positive number greater than 0
  if (amount <= 0) {
    return { success: false, error: "Payment amount must be greater than 0", status: 400 };
  }

  // 5. Start a try-catch block to gracefully handle any unexpected database or runtime errors
  try {
    
    // 6. Insert the new payment record into the 'payments' table and destructure the first returned row as 'payment'
    const [payment] = await db
      .insert(payments)
      .values({
        orderId: order.id,                 // Link payment to the fetched order
        outletId,                          // Store the outlet context
        amount: amount.toFixed(2),         // Convert the amount to a 2-decimal string (common for financial records)
        method,                            // Payment type (e.g., 'cash', 'card')
        receivedBy: userId,                // Track the staff member who processed it
      })
      .returning();                        // Request Postgres to return the newly created row

    // 7. Fetch all existing payments associated with this specific orderId (including the one just made)
    const existingPayments = await db.query.payments.findMany({
      where: (p, { eq }) => eq(p.orderId, order.id),
    });

    // 8. Calculate total amount paid by summing up the payments (converting string amounts back to Numbers)
    const totalPaid = existingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // 9. Convert the order's total cost from a string/decimal to a JavaScript Number
    const orderTotal = Number(order.total);
    
    // 10. Calculate remaining balance, ensuring it never goes below 0 (in case of overpayment)
    const balanceDue = Math.max(orderTotal - totalPaid, 0);

    // 11. Create a mutable copy of the order object to update later if the order gets closed
    let updatedOrder = order;

    // 12. Business Logic Check: If the total payments meet or exceed the total order cost...
    if (totalPaid >= orderTotal) {
      
      // 13. Update the order status to "completed" in the database and get the updated row
      const [closed] = await db
        .update(orders)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(orders.id, order.id))
        .returning();

      // 14. Assign the newly updated order data to our tracking variable
      updatedOrder = closed;

      // 15. Check if this is a Dine-In order and if it is assigned to a physical table
      if (order.orderType === "dine_in" && order.tableId) {
        
        // 16. Query for any *other* active orders currently assigned to this exact same table
        const otherActiveOrder = await db.query.orders.findFirst({
          where: (o, { eq, and }) =>
            and(
              eq(o.tableId, order.tableId!),
              ne(o.id, order.id),                         // Exclude the current order
              notInArray(o.status, ["completed", "cancelled"]) // Must not be closed or cancelled
            ),
        });

        // 17. If no other active orders are using this table, free it up by setting status to "available"
        if (!otherActiveOrder) {
          await db.update(diningTables).set({ status: "available" }).where(eq(diningTables.id, order.tableId));
        }
      }
    }

    // 18. Success response returning the generated payment, final order status, and financial balances
    return { success: true, data: { payment, order: updatedOrder, totalPaid, balanceDue } };
    
  } catch (error) {
    // 19. Error handling: Log the exact server-side error for developers to debug
    console.error("createPayment error:", error);
    
    // 20. Return a generic 500 Internal Server Error to the client for security masking
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

  return { success: true, data: { payments: paymentList, totalPaid, balanceDue, orderTotal: Number(order.total) } } as const;
}
