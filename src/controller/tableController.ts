import { db } from "@/db";
import { diningTables } from "@/db/schema";
import { and, eq } from "drizzle-orm";
export type TableStatus = "available" | "occupied" | "reserved" | "dirty";
export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as any).code === "23505"
  );
}

export const getTables = async (outletid: string) => {
  return db.query.diningTables.findMany({
    where: (t, { eq, and }) =>
      and(eq(t.outletId, outletid), eq(t.isActive, true)),
  });
};

export async function updateTableStatus(
  outletId: string,
  tableId: string,
  status: TableStatus,
) {
  const table = await db.query.diningTables.findFirst({
    where: (t, { eq, and }) => and(eq(t.id, tableId), eq(t.outletId, outletId)),
  });

  if (!table) {
    return { success: false, error: "Table not found", status: 404 } as const;
  }

  const [updated] = await db
    .update(diningTables)
    .set({ status, updatedAt: new Date() })
    .where(eq(diningTables.id, tableId))
    .returning();

  return { success: true, data: updated } as const;
}

export const createTable = async (
  outletId: string,
  input: {
    tableNumber: string;
    capacity?: number;
    shape?: "square" | "round" | "rectangle";
  },
) => {
  try {
    const [table] = await db
      .insert(diningTables)
      .values({
        outletId,
        tableNumber: input.tableNumber,
        capacity: input.capacity ?? 4,
        shape: input.shape ?? "square",
      })
      .returning({
        id: diningTables.id,
        tableNumber: diningTables.tableNumber,
        capacity: diningTables.capacity,
        shape: diningTables.shape,
        positionX: diningTables.positionX,
        positionY: diningTables.positionY,
      });

    return { success: true, data: table };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: `Table number "${input.tableNumber}" already exists at this outlet`,
        status: 409,
      };
    }
    console.error("updateTable error:", error);
    return { success: false, error: "Failed to update table", status: 500 };
  }
};
// update table
export async function updateTable(
  outletId: string,
  tableId: string,
  input: {
    tableNumber?: string;
    capacity?: number;
    shape?: "square" | "round" | "rectangle";
    positionX?: number;
    positionY?: number;
  }
): Promise<ControllerResult<{ id: string }>> {
  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (input.tableNumber !== undefined) updateValues.tableNumber = input.tableNumber;
  if (input.capacity !== undefined) updateValues.capacity = input.capacity;
  if (input.shape !== undefined) updateValues.shape = input.shape;
  if (input.positionX !== undefined) updateValues.positionX = input.positionX.toString();
  if (input.positionY !== undefined) updateValues.positionY = input.positionY.toString();

  try {
    const [updated] = await db
      .update(diningTables)
      .set(updateValues)
      .where(and(eq(diningTables.id, tableId), eq(diningTables.outletId, outletId)))
      .returning({ id: diningTables.id });

    if (!updated) {
      return { success: false, error: "Table not found", status: 404 };
    }

    return { success: true, data: { id: updated.id } }; // ✅ fixed
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: `Table number "${input.tableNumber}" already exists at this outlet`,
        status: 409,
      };
    }
    console.error("updateTable error:", error);
    return { success: false, error: "Failed to update table", status: 500 };
  }
}

// --------------------------delete table ------------------------------
export async function removeTable(
  outletId: string,
  tableId: string
): Promise<ControllerResult<null>> {
  try {
    const [deleted] = await db
      .delete(diningTables)
      .where(and(eq(diningTables.id, tableId), eq(diningTables.outletId, outletId)))
      .returning({ id: diningTables.id });

    if (!deleted) {
      return { success: false, error: "Table not found", status: 404 };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("removeTable error:", error);
    return { success: false, error: "Failed to remove table", status: 500 };
  }
}