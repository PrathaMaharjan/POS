import { eq, sql, inArray, Column } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  orderItems,
  diningTables,
  kotTickets,
  kotItems,
} from "@/db/schema";

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

    const [kotTicket] = await db
      .insert(kotTickets)
      .values({
        orderId: order.id,
        outletId: outletId,
        status: "pending",
      })
      .returning();

    await db.insert(kotItems).values(
      insertedItems.map((item) => ({
        kotTicketId: kotTicket.id,
        orderItemId: item.id,
      })),
    );

    return { success: true, data: { order, items: insertedItems } };
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

    await db
      .insert(kotItems)
      .values(
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
    })
  );

  return { success: true, data: { table, orders: ordersWithKot } } as const;
}


// ─────────────────────────────────────────────
// ADD ITEMS TO AN EXISTING ORDER
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
