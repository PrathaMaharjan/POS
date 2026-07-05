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

// export const createDineInOrder = async (
//   outletId: string,
//   userId: string,
//   input: CreateDineInOrderInput,
// ) => {
//   const TAX_RATE = 0.08;
//   const { items, tableId } = input;
//   const table = await db.query.diningTables.findFirst({
//     where: (t, { eq, and }) =>
//       and(eq(t.id, tableId), eq(t.outletId, outletId), eq(t.isActive, true)),
//   });
//   if (!table) {
//     return {
//       success: false,
//       error: "Invalid table for this outlet",
//       status: 400,
//     };
//   }
//   const priced = await priceItem(outletId, items);
//   if (!priced.success) return priced;
//   const { itemRows, subtotal } = priced.data;
//   const tax = subtotal * TAX_RATE;
//   const total = subtotal + tax;
//   const orderNumber = await getNextOrderNumber(outletId);

//   try {
//     const [order] = await db
//       .insert(orders)
//       .values({
//         outletId,
//         orderType: "dine_in",
//         tableId,
//         orderNumber,
//         status: "pending",
//         subtotal: subtotal.toFixed(2),
//         tax: tax.toFixed(2),
//         total: total.toFixed(2),
//         createdBy: userId,
//       })
//       .returning();

//     const insertedItems = await db
//       .insert(orderItems)
//       .values(itemRows.map((row) => ({ ...row, orderId: order.id })))
//       .returning();
//     // Mark the table as occupied now that it has an active order
//     await db
//       .update(diningTables)
//       .set({ status: "occupied" })
//       .where(eq(diningTables.id, tableId));
//     //stock decrement
//     const { stockWarnings } = await deductStockForOrder(
//       outletId,
//       order.id,
//       insertedItems.map((item) => ({
//         id: item.id,
//         productId: item.productId,
//         quantity: item.quantity,
//       })),
//       userId,
//     );

//     // const [kotTicket] = await db
//     //   .insert(kotTickets)
//     //   .values({
//     //     orderId: order.id,
//     //     outletId: outletId,
//     //     status: "pending",
//     //   })
//     //   .returning();

//     // await db.insert(kotItems).values(
//     //   insertedItems.map((item) => ({
//     //     kotTicketId: kotTicket.id,
//     //     orderItemId: item.id,
//     //   })),
//     // );

//     // return {
//     //   success: true,
//     //   data: {
//     //     order,
//     //     items: insertedItems,
//     //     stockWarnings,
//     //   },
//     // };
//     const kotStatus = await getInitialKotStatus(outletId); // ← NEW

//     const [kotTicket] = await db
//       .insert(kotTickets)
//       .values({
//         orderId: order.id,
//         outletId: outletId,
//         status: kotStatus, // ← was "pending", now dynamic
//       })
//       .returning();

//     await db.insert(kotItems).values(
//       insertedItems.map((item) => ({
//         kotTicketId: kotTicket.id,
//         orderItemId: item.id,
//       })),
//     );

//     return {
//       success: true,
//       data: { order, items: insertedItems, stockWarnings },
//     };
//   } catch (error) {
//     console.error("createDineInOrder error:", error);
//     return {
//       success: false,
//       error: "Failed to create dine-in order",
//       status: 500,
//     };
//   }
// };

// takeaway ============

// export const createDineInOrder = async (
//   outletId: string,
//   userId: string,
//   input: CreateDineInOrderInput,
// ) => {
//   const TAX_RATE = 0.08;
//   const { items, tableId } = input;

//   // ── STEP 1: fetch table + outlet IN PARALLEL (was sequential) ──
//   const [table, outlet] = await Promise.all([
//     db.query.diningTables.findFirst({
//       where: (t, { eq, and }) =>
//         and(eq(t.id, tableId), eq(t.outletId, outletId), eq(t.isActive, true)),
//       columns: { id: true, status: true }, // only what we need
//     }),
//     db.query.outlets.findFirst({
//       where: (o, { eq }) => eq(o.id, outletId),
//       columns: {
//         skipKitchenWorkflow: true,
//         taxEnabled: true, // ← new
//         taxRate: true, // ← new
//         taxName: true,
//       }, // replaces getInitialKotStatus() call
//     }),
//   ]);

//   if (!table) {
//     return {
//       success: false,
//       error: "Invalid table for this outlet",
//       status: 400,
//     };
//   }

//   // ── STEP 2: price items + get order number IN PARALLEL ──
//   const [priced, orderNumber] = await Promise.all([
//     priceItem(outletId, items),
//     getNextOrderNumber(outletId),
//   ]);

//   if (!priced.success) return priced;

//   const { itemRows, subtotal } = priced.data;
//   const tax = subtotal * TAX_RATE;
//   const total = subtotal + tax;

//   // ── KOT status from already-fetched outlet (no extra query) ──
//   const kotStatus = outlet?.skipKitchenWorkflow ? "ready" : "pending";

//   try {
//     // ── STEP 3: insert order ──
//     const [order] = await db
//       .insert(orders)
//       .values({
//         outletId,
//         orderType: "dine_in",
//         tableId,
//         orderNumber,
//         status: "pending",
//         subtotal: subtotal.toFixed(2),
//         taxAmount: tax.toFixed(2),
//         total: total.toFixed(2),
//         createdBy: userId,
//       })
//       .returning();

//     // ── STEP 4: insert order items ──
//     const insertedItems = await db
//       .insert(orderItems)
//       .values(itemRows.map((row) => ({ ...row, orderId: order.id })))
//       .returning();

//     // ── STEP 5: update table + insert KOT IN PARALLEL ──
//     const [kotTicket] = await Promise.all([
//       db
//         .insert(kotTickets)
//         .values({
//           orderId: order.id,
//           outletId: outletId,
//           status: kotStatus,
//         })
//         .returning()
//         .then((rows) => rows[0]),

//       db
//         .update(diningTables)
//         .set({ status: "occupied" })
//         .where(eq(diningTables.id, tableId)),
//     ]);

//     // ── STEP 6: insert KOT items ──
//     await db.insert(kotItems).values(
//       insertedItems.map((item) => ({
//         kotTicketId: kotTicket.id,
//         orderItemId: item.id,
//       })),
//     );

//     // ── STEP 7: deduct stock (non-blocking — don't slow down response) ──
//     deductStockForOrder(
//       outletId,
//       order.id,
//       insertedItems.map((item) => ({
//         id: item.id,
//         productId: item.productId,
//         quantity: item.quantity,
//       })),
//       userId,
//     ).catch((err) => console.error("deductStockForOrder error:", err));
//     // ↑ fire and forget — order response returns immediately
//     //   stock deduction happens in background

//     return {
//       success: true,
//       data: {
//         order,
//         items: insertedItems,
//         stockWarnings: [], // warnings come async now
//       },
//     };
//   } catch (error) {
//     console.error("createDineInOrder error:", error);
//     return {
//       success: false,
//       error: "Failed to create dine-in order",
//       status: 500,
//     };
//   }
// };

export const createDineInOrder = async (
  outletId: string,
  userId: string,
  input: CreateDineInOrderInput,
) => {
  const { items, tableId } = input;

  // ── STEP 1: fetch table + outlet IN PARALLEL ──
  const [table, outlet] = await Promise.all([
    db.query.diningTables.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.id, tableId), eq(t.outletId, outletId), eq(t.isActive, true)),
      columns: { id: true, status: true },
    }),
    db.query.outlets.findFirst({
      where: (o, { eq }) => eq(o.id, outletId),
      columns: {
        skipKitchenWorkflow: true,
        taxEnabled: true,
        taxRate: true,
        taxName: true,
      },
    }),
  ]);

  if (!table) {
    return {
      success: false,
      error: "Invalid table for this outlet",
      status: 400,
    };
  }

  if (!outlet) {
    return {
      success: false,
      error: "Outlet not found",
      status: 404,
    };
  }

  // ── STEP 2: price items + order number IN PARALLEL ──
  const [priced, orderNumber] = await Promise.all([
    priceItem(outletId, items),
    getNextOrderNumber(outletId),
  ]);

  if (!priced.success) return priced;

  const { itemRows, subtotal } = priced.data;

  // ── TAX — read from outlet config instead of hardcoded 0.08 ──
  // taxRate stored as percentage e.g. 13.00 means 13%
  const taxRate = outlet.taxEnabled ? parseFloat(outlet.taxRate ?? "0") : 0;
  const taxName = outlet.taxEnabled ? (outlet.taxName ?? "VAT") : null;
  const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const total = parseFloat((subtotal + taxAmount).toFixed(2));

  // ── KOT status from outlet config ──
  const kotStatus = outlet.skipKitchenWorkflow ? "ready" : "pending";

  try {
    // ── STEP 3: insert order ──
    const [order] = await db
      .insert(orders)
      .values({
        outletId,
        orderType: "dine_in",
        tableId,
        orderNumber,
        status: "pending",
        subtotal: subtotal.toFixed(2),
        taxRate: taxRate.toFixed(2), // ← saved so receipt can show it later
        taxAmount: taxAmount.toFixed(2), // ← actual tax in rupees
        total: total.toFixed(2), // ← subtotal + taxAmount
        createdBy: userId,
      })
      .returning();

    // ── STEP 4: insert order items ──
    const insertedItems = await db
      .insert(orderItems)
      .values(itemRows.map((row) => ({ ...row, orderId: order.id })))
      .returning();

    // ── STEP 5: update table + insert KOT IN PARALLEL ──
    const [kotTicket] = await Promise.all([
      db
        .insert(kotTickets)
        .values({
          orderId: order.id,
          outletId: outletId,
          status: kotStatus,
        })
        .returning()
        .then((rows) => rows[0]),

      db
        .update(diningTables)
        .set({ status: "occupied" })
        .where(eq(diningTables.id, tableId)),
    ]);

    // ── STEP 6: insert KOT items ──
    await db.insert(kotItems).values(
      insertedItems.map((item) => ({
        kotTicketId: kotTicket.id,
        orderItemId: item.id,
      })),
    );

    // ── STEP 7: deduct stock (non-blocking) ──
    deductStockForOrder(
      outletId,
      order.id,
      insertedItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
      userId,
    ).catch((err) => console.error("deductStockForOrder error:", err));

    return {
      success: true,
      data: {
        order,
        items: insertedItems,
        tax: {
          rate: taxRate, // e.g. 13
          amount: taxAmount, // e.g. 104.00
          name: taxName, // e.g. "VAT"
        },
        subtotal,
        total,
        stockWarnings: [],
      },
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
        taxAmount: tax.toFixed(2),
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
// export async function placeAndPayTakeawayOrder(
//   outletId: string,
//   userId: string,
//   input: {
//     customerName?: string;
//     customerPhone?: string;
//     items: OrderItemInput[];
//     payment: {
//       method: PaymentMethod;
//       amountTendered: number; // how much customer gave
//     };
//   },
// ): Promise<
//   ControllerResult<{
//     order?: typeof orders.$inferSelect;
//     payment: typeof payments.$inferSelect;
//     changeDue: number;
//     stockWarnings: string[];
//   }>
// > {
//   const { customerName, customerPhone, items, payment } = input;
//   const TAX_RATE = 0.08;

//   // ── 1. Price items first ──
//   const priced = await priceItem(outletId, items);
//   if (!priced.success) return priced;

//   const { itemRows, subtotal } = priced.data;
//   const tax = subtotal * TAX_RATE;
//   const total = subtotal + tax;

//   // ── 2. Validate payment amount ──
//   if (payment.amountTendered < total) {
//     return {
//       success: false,
//       error: `Insufficient payment. Required: Rs.${total.toFixed(2)}, received: Rs.${payment.amountTendered.toFixed(2)}`,
//       status: 400,
//     };
//   }

//   // ── 3. Calculate change ──
//   const changeDue =
//     payment.method === "cash" ? payment.amountTendered - total : 0; // no change for card/qr

//   const orderNumber = await getNextOrderNumber(outletId);

//   try {
//     // ── 4. Create order ──
//     const [order] = await db
//       .insert(orders)
//       .values({
//         outletId,
//         orderType: "takeaway",
//         tableId: null,
//         customerName,
//         customerPhone,
//         orderNumber,
//         status: "pending",
//         subtotal: subtotal.toFixed(2),
//         taxAmount: tax.toFixed(2),
//         total: total.toFixed(2),
//         createdBy: userId,
//       })
//       .returning();

//     // ── 5. Insert order items ──
//     const insertedItems = await db
//       .insert(orderItems)
//       .values(itemRows.map((row) => ({ ...row, orderId: order.id })))
//       .returning();

//     // ── 6. Record payment immediately ──
//     const amountToRecord = Math.min(payment.amountTendered, total);

//     const [paymentRecord] = await db
//       .insert(payments)
//       .values({
//         orderId: order.id,
//         outletId,
//         method: payment.method,
//         amount: amountToRecord.toFixed(2),
//         receivedBy: userId,
//       })
//       .returning();

//     // stock ------
//     // ── 6. deduct stock ── ← NEW
//     const { stockWarnings } = await deductStockForOrder(
//       outletId,
//       order.id,
//       insertedItems.map((item) => ({
//         id: item.id,
//         productId: item.productId,
//         quantity: item.quantity,
//       })),
//       userId,
//     );

//     // ── 7. Mark order as completed (paid) ──
//     const [completedOrder] = await db
//       .update(orders)
//       .set({ status: "completed", updatedAt: new Date() })
//       .where(eq(orders.id, order.id))
//       .returning();

//     // // ── 8. Create KOT (kitchen needs to know) ──
//     // const [kotTicket] = await db
//     //   .insert(kotTickets)
//     //   .values({ orderId: order.id, outletId, status: "pending" })
//     //   .returning();

//     // await db.insert(kotItems).values(
//     //   insertedItems.map((item) => ({
//     //     kotTicketId: kotTicket.id,
//     //     orderItemId: item.id,
//     //   })),
//     // );

//     // return {
//     //   success: true,
//     //   data: {
//     //     payment: paymentRecord,
//     //     changeDue: Number(changeDue.toFixed(2)),
//     //     stockWarnings,
//     //   },
//     // };
//     // ── get kitchen workflow setting ──
//     const kotStatus = await getInitialKotStatus(outletId); // ← NEW

//     const [kotTicket] = await db
//       .insert(kotTickets)
//       .values({ orderId: order.id, outletId, status: kotStatus }) // ← was "pending"
//       .returning();

//     await db.insert(kotItems).values(
//       insertedItems.map((item) => ({
//         kotTicketId: kotTicket.id,
//         orderItemId: item.id,
//       })),
//     );

//     return {
//       success: true,
//       data: {
//         order: completedOrder,
//         payment: paymentRecord,
//         changeDue,
//         stockWarnings,
//       },
//     };
//   } catch (error) {
//     console.error("placeAndPayTakeawayOrder error:", error);
//     return {
//       success: false,
//       error: "Failed to place takeaway order",
//       status: 500,
//     };
//   }
// }

export async function placeAndPayTakeawayOrder(
  outletId: string,
  userId: string,
  input: {
    customerName?: string;
    customerPhone?: string;
    items: OrderItemInput[];
    payment: {
      method: PaymentMethod;
      amountTendered: number;
    };
  },
): Promise<
  ControllerResult<{
    order: typeof orders.$inferSelect;
    payment: typeof payments.$inferSelect;
    changeDue: number;
    stockWarnings: string[];
    tax: {
      rate: number;
      amount: number;
      name: string | null;
    };
    subtotal: number;
    total: number;
  }>
> {
  const { customerName, customerPhone, items, payment } = input;

  // ── STEP 1: price items + order number + outlet IN PARALLEL ──
  const [priced, orderNumber, outlet] = await Promise.all([
    priceItem(outletId, items),
    getNextOrderNumber(outletId),
    db.query.outlets.findFirst({
      where: (o, { eq }) => eq(o.id, outletId),
      columns: {
        skipKitchenWorkflow: true,
        taxEnabled: true, // ← new
        taxRate: true, // ← new
        taxName: true, // ← new
      },
    }),
  ]);

  if (!priced.success) return priced;

  if (!outlet) {
    return {
      success: false,
      error: "Outlet not found",
      status: 404,
    };
  }

  const { itemRows, subtotal } = priced.data;

  // ── TAX — read from outlet config instead of hardcoded value ──
  // taxRate stored as percentage e.g. 13.00 means 13%
  const taxRate = outlet.taxEnabled ? parseFloat(outlet.taxRate ?? "0") : 0;
  const taxName = outlet.taxEnabled ? (outlet.taxName ?? "VAT") : null;
  const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const total = parseFloat((subtotal + taxAmount).toFixed(2));

  // ── validate payment ──
  if (payment.amountTendered < total) {
    return {
      success: false,
      error: `Insufficient payment. Required: Rs.${total.toFixed(2)}, received: Rs.${payment.amountTendered.toFixed(2)}`,
      status: 400,
    };
  }

  const changeDue =
    payment.method === "cash" ? payment.amountTendered - total : 0;

  // ── KOT status from outlet config ──
  const kotStatus = outlet.skipKitchenWorkflow ? "ready" : "pending";

//   try {
//     // ── STEP 2: insert order ──
//     const [order] = await db
//       .insert(orders)
//       .values({
//         outletId,
//         orderType: "takeaway",
//         tableId: null,
//         customerName: customerName ?? null,
//         customerPhone: customerPhone ?? null,
//         orderNumber,
//         status: "pending",
//         subtotal: subtotal.toFixed(2),
//         tax: taxAmount.toFixed(2), // ← keep existing "tax" column
//         taxRate: taxRate.toFixed(2), // ← new column
//         taxAmount: taxAmount.toFixed(2), // ← new column
//         total: total.toFixed(2), // ← subtotal + taxAmount
//         createdBy: userId,
//       })
//       .returning();

//     // ── STEP 3: insert order items ──
//     const insertedItems = await db
//       .insert(orderItems)
//       .values(itemRows.map((row) => ({ ...row, orderId: order.id })))
//       .returning();

//     // ── STEP 4: insert payment ──
//     const amountToRecord = Math.min(payment.amountTendered, total);
//     const [paymentRecord] = await db
//       .insert(payments)
//       .values({
//         orderId: order.id,
//         outletId,
//         method: payment.method,
//         amount: amountToRecord.toFixed(2),
//         receivedBy: userId,
//       })
//       .returning();

//     // ── STEP 5: deduct stock (non-blocking) ──
//     deductStockForOrder(
//       outletId,
//       order.id,
//       insertedItems.map((item) => ({
//         id: item.id,
//         productId: item.productId,
//         quantity: item.quantity,
//       })),
//       userId,
//     ).catch((err) => console.error("deductStockForOrder error:", err));

//     // ── STEP 6: mark order as completed ──
//     const [completedOrder] = await db
//       .update(orders)
//       .set({ status: "completed", updatedAt: new Date() })
//       .where(eq(orders.id, order.id))
//       .returning();

//     // ── STEP 7: insert KOT ──
//     const [kotTicket] = await db
//       .insert(kotTickets)
//       .values({
//         orderId: order.id,
//         outletId,
//         status: kotStatus,
//       })
//       .returning();

//     await db.insert(kotItems).values(
//       insertedItems.map((item) => ({
//         kotTicketId: kotTicket.id,
//         orderItemId: item.id,
//       })),
//     );

//     // ── STEP 8: return ──
//     return {
//       success: true,
//       data: {
//         order: completedOrder,
//         payment: paymentRecord,
//         changeDue: Number(changeDue.toFixed(2)),
//         tax: {
//           rate: taxRate, // e.g. 13
//           amount: taxAmount, // e.g. 104.00
//           name: taxName, // e.g. "VAT"
//         },
//         subtotal,
//         total,
//         stockWarnings: [],
//       },
//     };
//   } catch (error) {
//     console.error("placeAndPayTakeawayOrder error:", error);
//     return {
//       success: false,
//       error: "Failed to place takeaway order",
//       status: 500,
//     };
//   }
// }
try {
    // ── STEP 2: insert order — status "completed" DIRECTLY ──
    // (was: insert "pending" then update to "completed" — wasted a round trip)
    const [order] = await db
      .insert(orders)
      .values({
        outletId,
        orderType:     "takeaway",
        tableId:       null,
        customerName:  customerName ?? null,
        customerPhone: customerPhone ?? null,
        orderNumber,
        status:        "completed",          // ← directly completed, no update later
        subtotal:      subtotal.toFixed(2),
        tax:           taxAmount.toFixed(2),
        taxRate:       taxRate.toFixed(2),
        taxAmount:     taxAmount.toFixed(2),
        total:         total.toFixed(2),
        createdBy:     userId,
      })
      .returning();

    // ── STEP 3: order items + payment + KOT ticket IN PARALLEL ──
    // all three only need order.id — no reason to run sequentially
    const amountToRecord = Math.min(payment.amountTendered, total);

    const [insertedItems, paymentRecord, kotTicket] = await Promise.all([
      db
        .insert(orderItems)
        .values(itemRows.map((row) => ({ ...row, orderId: order.id })))
        .returning(),

      db
        .insert(payments)
        .values({
          orderId:    order.id,
          outletId,
          method:     payment.method,
          amount:     amountToRecord.toFixed(2),
          receivedBy: userId,
        })
        .returning()
        .then((rows) => rows[0]),

      db
        .insert(kotTickets)
        .values({
          orderId:  order.id,
          outletId,
          status:   kotStatus,
        })
        .returning()
        .then((rows) => rows[0]),
    ]);

    // ── STEP 4: KOT items (needs kotTicket.id + insertedItems from above) ──
    await db.insert(kotItems).values(
      insertedItems.map((item) => ({
        kotTicketId: kotTicket.id,
        orderItemId: item.id,
      })),
    );

    // ── STEP 5: deduct stock (non-blocking — unchanged) ──
    deductStockForOrder(
      outletId,
      order.id,
      insertedItems.map((item) => ({
        id:        item.id,
        productId: item.productId,
        quantity:  item.quantity,
      })),
      userId,
    ).catch((err) => console.error("deductStockForOrder error:", err));

    // ── STEP 6: return ──
    return {
      success: true,
      data: {
        order,                    // ← already "completed", no separate update needed
        payment:   paymentRecord,
        changeDue: Number(changeDue.toFixed(2)),
        tax: {
          rate:   taxRate,
          amount: taxAmount,
          name:   taxName,
        },
        subtotal,
        total,
        stockWarnings: [],
      },
    };
  } catch (error) {
    console.error("placeAndPayTakeawayOrder error:", error);
    return {
      success: false,
      error:   "Failed to place takeaway order",
      status:  500,
    };
  }
}