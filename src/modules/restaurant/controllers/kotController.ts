import { db } from "@/db";
import { kotTickets } from "@/db/schema";
import { eq } from "drizzle-orm";

type KotStatus = "pending" | "preparing" | "ready" | "served";

const KOT_STATUS_TRANSITIONS: Record<KotStatus, KotStatus[]> = {
  pending: ["preparing", "ready"],
  preparing: ["ready", "pending"],
  ready: ["preparing", "pending", "served"],
  served: ["ready"],
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
