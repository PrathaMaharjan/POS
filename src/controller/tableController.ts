import { db } from "@/db";
import { diningTables } from "@/db/schema";
import { eq } from "drizzle-orm";

// export async function getTables(outletId: string) {
//   return db.query.diningTables.findMany({
//     where: (t, { eq, and }) => and(eq(t.outletId, outletId), eq(t.isActive, true)),
//     orderBy: (t, { asc }) => asc(t.tableNumber),
//   });
// }
export type TableStatus = "available" | "occupied" | "reserved" | "dirty";


export const  getTables =async (outletid:string)=>{
return db.query.diningTables.findMany({
    where : (t,{eq,and})=> and(eq(t.outletId,outletid),eq(t.isActive,true))
})
}


export async function updateTableStatus(outletId: string, tableId: string, status: TableStatus) {
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

