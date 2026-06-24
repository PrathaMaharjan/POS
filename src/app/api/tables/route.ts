import { createTable, getTables } from "@/controller/tableController";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const createSchema = z.object({
  tableNumber: z.string().min(1).max(20),
  capacity:    z.number().int().min(1).optional(),
  shape:       z.enum(["square", "round", "rectangle"]).optional(),
  positionX:   z.number().optional(),
  positionY:   z.number().optional(),
  outletId:    z.string().uuid().optional(), // ← Owner passes this
});

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "restaurant.tables.read");
  if (permError) return permError;

  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId")
  );
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const tables = await getTables(resolved.outletId);
  return NextResponse.json({ tables });
}

// export async function POST(req: NextRequest) {
//   const auth = await requiredToken(req);
//   if (!auth.ok) return auth.response;

//   const permError = requiredPermission(auth.payload, "restaurant.tables.create");
//   if (permError) return permError;

//   const body = await req.json();
//   const parsed = createSchema.safeParse(body);
//   if (!parsed.success) {
//     return NextResponse.json(
//       { error: parsed.error.flatten() },
//       { status: 400 },
//     );
//   }

//   const result = await createTable(auth.payload.activeOutletId!, parsed.data);

//   if (!result.success) {
//     return NextResponse.json(
//       { error: result.error },
//       { status: result.status },
//     );
//   }

//   return NextResponse.json(result.data, { status: 201 });
// }

export async function POST(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "restaurant.tables.create");
  if (permError) return permError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Owner → can pass outletId in body, Manager → uses JWT
  const outletId = auth.payload.role === "Owner"
    ? (parsed.data.outletId ?? auth.payload.activeOutletId!)
    : auth.payload.activeOutletId!;

  if (!outletId) {
    return NextResponse.json({ error: "No outlet found" }, { status: 400 });
  }

  const { outletId: _, ...tableData } = parsed.data; // strip outletId from table data

  const result = await createTable(outletId, tableData);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 201 });
}