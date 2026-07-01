import { eq, sql, inArray, Column, ne, and, notInArray } from "drizzle-orm";
import { payments } from "@/db/schema"; // add to existing imports
import { db } from "@/db";
import {
  orders,
  orderItems,
  diningTables,
  kotTickets,
  kotItems,
} from "@/db/schema";
import {
  deductStockForOrder,
  restoreStockForOrder,
} from "./inventory/inventoy";

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

interface OrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
}

interface PricedItems {
  itemRows: {
    productId: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
    notes?: string;
  }[];
  subtotal: number;
}

async function getInitialKotStatus(
  outletId: string,
): Promise<"pending" | "ready"> {
  const outlet = await db.query.outlets.findFirst({
    where: (o, { eq }) => eq(o.id, outletId),
    columns: { skipKitchenWorkflow: true },
  });

  return outlet?.skipKitchenWorkflow ? "ready" : "pending";
}

// shared validate products belong to outlet.are active.available and snapsort price

const priceItem = async (
  outletId: string,
  items: OrderItemInput[],
): Promise<
  | { success: true; data: PricedItems }
  | { success: false; error: string; status: number }
> => {
  const productIds = [...new Set(items.map((i) => i.productId))];

  const dbProducts = await db.query.products.findMany({
    where: (p, { eq, and }) =>
      and(
        eq(p.outletId, outletId),
        eq(p.isActive, true),
        eq(p.isAvailable, true),
        inArray(p.id, productIds),
      ),
  });
  if (dbProducts.length !== productIds.length) {
    return {
      success: false,
      error:
        "One or more products are invalid, unavailable, or do not belong to this outlet",
      status: 400,
    };
  }
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));
  let subTotal = 0;
  const itemRows = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.price);
    const lineSubtotal = unitPrice * item.quantity;
    subTotal += lineSubtotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: unitPrice.toFixed(2),
      subtotal: lineSubtotal.toFixed(2),
      notes: item.notes,
    };
  });
  return { success: true, data: { itemRows, subtotal: subTotal } };
};

async function getNextOrderNumber(outletId: string): Promise<number> {
  const result = await db
    .select({
      maxOrderNumber: sql<number>`coalesce(max(${orders.orderNumber}), 0)`,
    })
    .from(orders)
    .where(eq(orders.outletId, outletId));

  return (result[0]?.maxOrderNumber ?? 0) + 1;
}

type OrderWithItems = {
  order: typeof orders.$inferSelect;
  items: (typeof orderItems.$inferSelect)[];
};

// Dine-in ----------------------------------------------
export interface CreateDineInOrderInput {
  tableId: string;
  items: OrderItemInput[];
}

export const createDineInOrder = async (
  outletId: string,
  userId: string,
  input: CreateDineInOrderInput,
) => {
  const TAX_RATE = 0.08;
  const { items, tableId } = input;
  const table = await db.query.diningTables.findFirst({
    where: (t, { eq, and }) =>
      and(eq(t.id, tableId), eq(t.outletId, outletId), eq(t.isActive, true)),
  });
  if (!table) {
    return {
      success: false,
      error: "Invalid table for this outlet",
      status: 400,
    };
  }
  const priced = await priceItem(outletId, items);
  if (!priced.success) return priced;
  const { itemRows, subtotal } = priced.data;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const orderNumber = await getNextOrderNumber(outletId);

  try {
    const [order] = await db
      .insert(orders)
      .values({
        outletId,
        orderType: "dine_in",
        tableId,
        orderNumber,
        status: "pending",
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        createdBy: userId,
      })
      .returning();

    const insertedItems = await db
      .insert(orderItems)
      .values(itemRows.map((row) => ({ ...row, orderId: order.id })))
      .returning();
    // Mark the table as occupied now that it has an active order
    await db
      .update(diningTables)
      .set({ status: "occupied" })
      .where(eq(diningTables.id, tableId));
    //stock decrement
    const { stockWarnings } = await deductStockForOrder(
      outletId,
      order.id,
      insertedItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
      userId,
    );

    // const [kotTicket] = await db
    //   .insert(kotTickets)
    //   .values({
    //     orderId: order.id,
    //     outletId: outletId,
    //     status: "pending",
    //   })
    //   .returning();

    // await db.insert(kotItems).values(
    //   insertedItems.map((item) => ({
    //     kotTicketId: kotTicket.id,
    //     orderItemId: item.id,
    //   })),
    // );

    // return {
    //   success: true,
    //   data: {
    //     order,
    //     items: insertedItems,
    //     stockWarnings,
    //   },
    // };
    const kotStatus = await getInitialKotStatus(outletId); // ← NEW

    const [kotTicket] = await db
      .insert(kotTickets)
      .values({
        orderId: order.id,
        outletId: outletId,
        status: kotStatus, // ← was "pending", now dynamic
      })
      .returning();

    await db.insert(kotItems).values(
      insertedItems.map((item) => ({
        kotTicketId: kotTicket.id,
        orderItemId: item.id,
      })),
    );

    return {
      success: true,
      data: { order, items: insertedItems, stockWarnings },
    };
  } catch (error) {
    console.error("createDineInOrder error:", error);
    return {
      success: false,
      error: "Failed to create dine-in order",
      status: 500,
    };
  }
};

// takeaway ============
export interface CreateTakeawayOrderInput {
  customerName?: string;
  customerPhone?: string;
  items: OrderItemInput[];
}

export async function createTakeawayOrder(
  outletId: string,
  userId: string,
  input: CreateTakeawayOrderInput,
): Promise<ControllerResult<OrderWithItems>> {
  const { customerName, customerPhone, items } = input;

  const priced = await priceItem(outletId, items);
  if (!priced.success) return priced;

  const { itemRows, subtotal } = priced.data;

  const TAX_RATE = 0.08;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const orderNumber = await getNextOrderNumber(outletId);

  try {
    const [order] = await db
      .insert(orders)
      .values({
        outletId,
        orderType: "takeaway",
        tableId: null,
        customerName,
        customerPhone,
        orderNumber,
        status: "pending",
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        createdBy: userId,
      })
      .returning();

    const insertedItems = await db
      .insert(orderItems)
      .values(itemRows.map((row) => ({ ...row, orderId: order.id })))
      .returning();

    const [kotTicket] = await db
      .insert(kotTickets)
      .values({ orderId: order.id, outletId, status: "pending" })
      .returning();

    await db.insert(kotItems).values(
      insertedItems.map((item) => ({
        kotTicketId: kotTicket.id,
        orderItemId: item.id,
      })),
    );

    return { success: true, data: { order, items: insertedItems } };
  } catch (error) {
    console.error("createTakeawayOrder error:", error);
    return {
      success: false,
      error: "Failed to create takeaway order",
      status: 500,
    };
  }
}
// read ..........
export const listOrder = async (outletId: string) => {
  return db.query.orders.findMany({
    where: (o, { eq }) => eq(o.outletId, outletId),
    orderBy: (o, { desc }) => desc(o.createdAt),
    limit: 50,
    with: {
      items: {
        with: {
          product: true,
        },
      },
      table: true,
      payments: true,
    },
  });
};
// single order detail
export async function getOrderById(outletId: string, orderId: string) {
  return db.query.orders.findFirst({
    where: (o, { eq, and }) => and(eq(o.id, orderId), eq(o.outletId, outletId)),
    with: {
      items: { with: { product: true } },
    },
  });
}

// "Active" = not completed and not cancelled - i.e. the table's ongoing session
export async function getOrderByTable(outletId: string, tableId: string) {
  const table = await db.query.diningTables.findFirst({
    where: (t, { eq, and }) => and(eq(t.id, tableId), eq(t.outletId, outletId)),
  });

  if (!table) {
    return { success: false, error: "Table not found", status: 404 } as const;
  }

  const activeOrders = await db.query.orders.findMany({
    where: (o, { eq, and, notInArray }) =>
      and(
        eq(o.outletId, outletId),
        eq(o.tableId, tableId),
        notInArray(o.status, ["completed", "cancelled"]),
      ),
    orderBy: (o, { asc }) => asc(o.createdAt),
    with: {
      items: { with: { product: true } },
    },
  });

  const ordersWithKot = await Promise.all(
    activeOrders.map(async (order) => {
      const kotTicketsList = await db.query.kotTickets.findMany({
        where: (k, { eq }) => eq(k.orderId, order.id),
      });
      return { ...order, kotTickets: kotTicketsList };
    }),
  );
  // // ── deduplicate by order id ──
  // const uniqueOrders = ordersWithKot.filter(
  //   (order, index, self) => index === self.findIndex((o) => o.id === order.id),
  // );

  return { success: true, data: { table, orders: ordersWithKot } } as const;
}

// ─────────────────────────────────────────────
// ADD ITEMS TO AN EXISTING ORDER~
// ─────────────────────────────────────────────

// export async function addItemsToOrder(
//   outletId: string,
//   orderId: string,
//   items: OrderItemInput[]
// ): Promise<ControllerResult<OrderWithItems>> {
//   const order = await db.query.orders.findFirst({
//     where: (o, { eq, and }) => and(eq(o.id, orderId), eq(o.outletId, outletId)),
//   });

//   if (!order) {
//     return { success: false, error: "Order not found", status: 404 };
//   }

//   if (order.status === "completed" || order.status === "cancelled") {
//     return { success: false, error: `Cannot add items to a ${order.status} order`, status: 400 };
//   }

//   const priced = await priceItem(outletId, items);
//   if (!priced.success) return priced;

//   const { itemRows, subtotal: newItemsSubtotal } = priced.data;

//   const newSubtotal = Number(order.subtotal) + newItemsSubtotal;
//   const tax = Number(order.tax);
//   const newTotal = newSubtotal + tax;

//   try {
//     const insertedItems = await db
//       .insert(orderItems)
//       .values(itemRows.map((row) => ({ ...row, orderId: order.id })))
//       .returning();

//     const [updatedOrder] = await db
//       .update(orders)
//       .set({
//         subtotal: newSubtotal.toFixed(2),
//         total: newTotal.toFixed(2),
//         updatedAt: new Date(),
//       })
//       .where(eq(orders.id, order.id))
//       .returning();

//     return { success: true, data: { order: updatedOrder, items: insertedItems } };
//   } catch (error) {
//     console.error("addItemsToOrder error:", error);
//     return { success: false, error: "Failed to add items to order", status: 500 };
//   }
// }

export async function cancelOrder(
  outletId: string,
  orderId: string,
): Promise<ControllerResult<typeof orders.$inferSelect>> {
  const order = await db.query.orders.findFirst({
    where: (o, { eq, and }) => and(eq(o.id, orderId), eq(o.outletId, outletId)),
  });

  if (!order) {
    return { success: false, error: "Order not found", status: 404 };
  }

  if (order.status === "completed") {
    return {
      success: false,
      error: "Cannot cancel a completed order",
      status: 400,
    };
  }

  if (order.status === "cancelled") {
    return { success: false, error: "Order is already cancelled", status: 400 };
  }

  try {
    const [cancelledOrder] = await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    await db
      .update(kotTickets)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(kotTickets.orderId, orderId),
          ne(kotTickets.status, "cancelled"),
        ),
      );
    // Free the dine-in table if no other active orders remain on it
    if (order.orderType === "dine_in" && order.tableId) {
      const otherActiveOrder = await db.query.orders.findFirst({
        where: (o, { eq, and }) =>
          and(
            eq(o.tableId, order.tableId!),
            ne(o.id, order.id),
            notInArray(o.status, ["completed", "cancelled"]),
          ),
      });
      if (!otherActiveOrder) {
        await db
          .update(diningTables)
          .set({ status: "available" })
          .where(eq(diningTables.id, order.tableId));
      }
    }
    restoreStockForOrder(outletId, orderId).catch((err) =>
      console.error("Stock restore failed for order", orderId, err),
    );
    return { success: true, data: cancelledOrder };
  } catch (error) {
    console.error("cancelOrder error:", error);
    return { success: false, error: "Failed to cancel order", status: 500 };
  }
}

//-------------------------------------- payment for takeawya ----------------------------------------

export type PaymentMethod = "cash" | "card" | "qr";

// ─────────────────────────────────────────────
// PLACE TAKEAWAY ORDER + PAYMENT IN ONE SHOT
// Order is only created after payment is confirmed
// ─────────────────────────────────────────────
export async function placeAndPayTakeawayOrder(
  outletId: string,
  userId: string,
  input: {
    customerName?: string;
    customerPhone?: string;
    items: OrderItemInput[];
    payment: {
      method: PaymentMethod;
      amountTendered: number; // how much customer gave
    };
  },
): Promise<
  ControllerResult<{
    order?: typeof orders.$inferSelect;
    payment: typeof payments.$inferSelect;
    changeDue: number;
    stockWarnings: string[];
  }>
> {
  const { customerName, customerPhone, items, payment } = input;
  const TAX_RATE = 0.08;

  // ── 1. Price items first ──
  const priced = await priceItem(outletId, items);
  if (!priced.success) return priced;

  const { itemRows, subtotal } = priced.data;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // ── 2. Validate payment amount ──
  if (payment.amountTendered < total) {
    return {
      success: false,
      error: `Insufficient payment. Required: Rs.${total.toFixed(2)}, received: Rs.${payment.amountTendered.toFixed(2)}`,
      status: 400,
    };
  }

  // ── 3. Calculate change ──
  const changeDue =
    payment.method === "cash" ? payment.amountTendered - total : 0; // no change for card/qr

  const orderNumber = await getNextOrderNumber(outletId);

  try {
    // ── 4. Create order ──
    const [order] = await db
      .insert(orders)
      .values({
        outletId,
        orderType: "takeaway",
        tableId: null,
        customerName,
        customerPhone,
        orderNumber,
        status: "pending",
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        createdBy: userId,
      })
      .returning();

    // ── 5. Insert order items ──
    const insertedItems = await db
      .insert(orderItems)
      .values(itemRows.map((row) => ({ ...row, orderId: order.id })))
      .returning();

    // ── 6. Record payment immediately ──
    const amountToRecord = Math.min(payment.amountTendered, total);

    const [paymentRecord] = await db
      .insert(payments)
      .values({
        orderId: order.id,
        outletId,
        method: payment.method,
        amount: amountToRecord.toFixed(2),
        receivedBy: userId,
      })
      .returning();

    // stock ------
    // ── 6. deduct stock ── ← NEW
    const { stockWarnings } = await deductStockForOrder(
      outletId,
      order.id,
      insertedItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
      userId,
    );

    // ── 7. Mark order as completed (paid) ──
    const [completedOrder] = await db
      .update(orders)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(orders.id, order.id))
      .returning();

    // // ── 8. Create KOT (kitchen needs to know) ──
    // const [kotTicket] = await db
    //   .insert(kotTickets)
    //   .values({ orderId: order.id, outletId, status: "pending" })
    //   .returning();

    // await db.insert(kotItems).values(
    //   insertedItems.map((item) => ({
    //     kotTicketId: kotTicket.id,
    //     orderItemId: item.id,
    //   })),
    // );

    // return {
    //   success: true,
    //   data: {
    //     payment: paymentRecord,
    //     changeDue: Number(changeDue.toFixed(2)),
    //     stockWarnings,
    //   },
    // };
  // ── get kitchen workflow setting ──
  const kotStatus = await getInitialKotStatus(outletId); // ← NEW

  const [kotTicket] = await db
    .insert(kotTickets)
    .values({ orderId: order.id, outletId, status: kotStatus }) // ← was "pending"
    .returning();

  await db.insert(kotItems).values(
    insertedItems.map((item) => ({
      kotTicketId: kotTicket.id,
      orderItemId: item.id,
    }))
  );

  return {
    success: true,
    data: { order: completedOrder, payment: paymentRecord, changeDue, stockWarnings },
  };

  } catch (error) {
    console.error("placeAndPayTakeawayOrder error:", error);
    return {
      success: false,
      error: "Failed to place takeaway order",
      status: 500,
    };
  }
}
