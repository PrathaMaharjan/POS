import { ControllerResult } from "@/controller/password";
import { db } from "@/db";
import { kotItems, kotTickets } from "@/db/schema";
import { eq } from "drizzle-orm";

type KotStatus = "pending" | "preparing" | "ready" | "cancelled" | "served";

const KOT_STATUS_TRANSITIONS: Record<KotStatus, KotStatus[]> = {
  pending: ["preparing", "ready","cancelled"],
  preparing: ["ready", "pending","cancelled"],
  ready: ["preparing", "pending", "served","cancelled"],
  served: ["ready"],
  cancelled: [],
};

export async function listKotTickets(outletId: string) {
  return db.query.kotTickets.findMany({
    where: (k, { eq }) => eq(k.outletId, outletId),
    orderBy: (k, { asc }) => asc(k.createdAt),
    columns: {
      id: true,
      status: true,
      createdAt: true,
    },
    with: {
      order: {
        columns: {
          orderType: true,
          orderNumber: true,
          tableId: true,
          customerName: true,
          
        },
        with: {
          table: {
            columns: {
              tableNumber: true,
            },
          },
        },
      },
      items: {
        columns: {
          id: true,
          status:true
        },
        with: {
          orderItem: {
            columns: {
            
              quantity: true,
              notes: true,
            },
            with: {
              product: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getKotTicketById(outletId: string, kotId: string) {
  return db.query.kotTickets.findFirst({
    where: (k, { eq, and }) => and(eq(k.id, kotId), eq(k.outletId, outletId)),
    columns: {
      id: true,
      status: true,
      createdAt: true,
    },
    with: {
      order: {
        columns: {
          orderType: true,
          orderNumber: true,
          tableId: true,
          customerName: true,
        },
        with: {
          table: {
            columns: {
              tableNumber: true,
            },
          },
        },
      },
      items: {
        columns: {
          id: true,
        },
        with: {
          orderItem: {
            columns: {
              quantity: true,
              notes: true,
            },
            with: {
              product: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
export async function updateKotStatus(
  outletId: string,
  kotId: string,
  newStatus: KotStatus,
) {
  const ticket = await db.query.kotTickets.findFirst({
    where: (k, { eq, and }) => and(eq(k.id, kotId), eq(k.outletId, outletId)),
  });

  if (!ticket) {
    return {
      success: false,
      error: "KOT ticket not found",
      status: 404,
    } as const;
  }

  const allowedNext = KOT_STATUS_TRANSITIONS[ticket.status as KotStatus];
  if (!allowedNext.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot change KOT status from "${ticket.status}" to "${newStatus}"`,
      status: 400,
    } as const;
  }

  //   const [updated] = await db
  //     .update(kotTickets)
  //     .set({ status: newStatus, updatedAt: new Date() })
  //     .where(eq(kotTickets.id, kotId))
  //     .returning();
  const [updated] = await db
    .update(kotTickets)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(kotTickets.id, kotId))
    .returning();

  return { success: true, data: updated } as const;
}



const KOT_STATUS_FLOW: Record<KotStatus, KotStatus[]> = {
  pending:   ["preparing", "cancelled"],
  preparing: ["ready", "pending", "cancelled"],
  ready:     ["served", "preparing", "cancelled"],
  cancelled: [], // terminal
  served:    ["ready"], 
};

export async function updateKotItemStatus(
  outletId:  string,
  kotItemId: string,
  newStatus: Exclude<KotStatus, "pending"> 
): Promise<ControllerResult<{
  item:         typeof kotItems.$inferSelect;
  ticketStatus: KotStatus;
}>> {

  const item = await db.query.kotItems.findFirst({
    where: (ki, { eq }) => eq(ki.id, kotItemId),
    with: {
      kotTicket: {
        columns: { id: true, outletId: true, status: true },
      },
    },
  });

  if (!item || item.kotTicket.outletId !== outletId) {
    return { success: false, error: "KOT item not found", status: 404 };
  }

  const currentStatus = item.status as KotStatus;
  const allowed = KOT_STATUS_FLOW[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error:  `Cannot move item from "${currentStatus}" to "${newStatus}"`,
      status: 400,
    };
  }

  try {
    const [updatedItem, siblingItems] = await Promise.all([
      db
        .update(kotItems)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(kotItems.id, kotItemId))
        .returning()
        .then((rows) => rows[0]),

      db.query.kotItems.findMany({
        where: (ki, { eq }) => eq(ki.kotTicketId, item.kotTicket.id),
        columns: { id: true, status: true },
      }),
    ]);

    const statuses: KotStatus[] = siblingItems.map((s) =>
      s.id === kotItemId ? newStatus : (s.status as KotStatus)
    );

    const derivedStatus = deriveTicketStatus(statuses);

    if (derivedStatus !== item.kotTicket.status) {
      await db
        .update(kotTickets)
        .set({ status: derivedStatus, updatedAt: new Date() })
        .where(eq(kotTickets.id, item.kotTicket.id));
    }

    return {
      success: true,
      data: {
        item:         updatedItem,
        ticketStatus: derivedStatus,
      },
    };
  } catch (error) {
    console.error("updateKotItemStatus error:", error);
    return {
      success: false,
      error:  "Failed to update KOT item status",
      status: 500,
    };
  }
}

function deriveTicketStatus(statuses: KotStatus[]): KotStatus {

  const active = statuses.filter((s) => s !== "cancelled");
  if (active.length === 0) return "cancelled";
  if (active.every((s) => s === "served"))                    return "served";
  if (active.every((s) => s === "ready" || s === "served"))   return "ready";
  if (active.some((s) => s === "preparing" || s === "ready" || s === "served"))
    return "preparing";

  return "pending";
}
