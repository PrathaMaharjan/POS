import { db } from "@/db";

// export async function getTables(outletId: string) {
//   return db.query.diningTables.findMany({
//     where: (t, { eq, and }) => and(eq(t.outletId, outletId), eq(t.isActive, true)),
//     orderBy: (t, { asc }) => asc(t.tableNumber),
//   });
// }

export const  getTables =async (outletid:string)=>{
return db.query.diningTables.findMany({
    where : (t,{eq,and})=> and(eq(t.outletId,outletid),eq(t.isActive,true))
})
}
