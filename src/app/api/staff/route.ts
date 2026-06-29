import { createStaff, listStaff } from "@/controller/staff";
import { requiredToken } from "@/lib/auth/requireAuth";
import { sendStaffWelcomeEmail } from "@/lib/email/sendStaffWelcomeEmail";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";


export async function POST(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.users.create");
  if (permError) return permError;

  const isOwner = auth.payload.role === "Owner";

  const createSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    role: isOwner
      ? z.enum(["Manager", "Cashier", "Waiter", "Kitchen Crew"])
      : z.enum(["Cashier", "Waiter", "Kitchen Crew"]),
    password: z.string().min(8),
    // ← outletId only required when Owner is calling
    outletId: isOwner
      ? z.string().uuid()
      : z.string().uuid().optional(),
  });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // ── resolve outletId ──
  // Owner → must come from request body
  // Manager → always use their activeOutletId from JWT
  const outletId = isOwner
    ? parsed.data.outletId!
    : auth.payload.activeOutletId!;

  if (!outletId) {
    return NextResponse.json(
      { error: "No active outlet found" },
      { status: 400 }
    );
  }

  const result = await createStaff(
    auth.payload.organizationId,
    outletId,
    parsed.data,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
    sendStaffWelcomeEmail(
    parsed.data.email,
    parsed.data.name,
    parsed.data.password,
    outletId,    
    parsed.data.role
  ).catch((err) => console.error("Staff welcome email failed:", err));

  return NextResponse.json(result.data, { status: 201 });
}


// export async function GET(req: NextRequest) {
//   const auth = await requiredToken(req);
//   if (!auth.ok) return auth.response;

//   const permError = requiredPermission(auth.payload, "core.users.read");
//   if (permError) return permError;

//   const searchParams = req.nextUrl.searchParams;
//   const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100); // cap at 100
//   const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
//   const offset = (page - 1) * limit;

//   const { staff, total } = await listStaff(auth.payload.activeOutletId!, limit, offset);

//   return NextResponse.json({
//     staff,
//     pagination: {
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//     },
//   });
// }

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.users.read");
  if (permError) return permError;

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const offset = (page - 1) * limit;

  const isOwner = auth.payload.role === "Owner";

  // Owner → can pass ?outletId= to view any outlet's staff
  // Manager → always uses their own activeOutletId from JWT
  const outletId = isOwner
    ? (searchParams.get("outletId") ?? auth.payload.activeOutletId!)
    : auth.payload.activeOutletId!;

  if (!outletId) {
    return NextResponse.json({ error: "No outlet found" }, { status: 400 });
  }

  const { staff, total } = await listStaff(outletId, limit, offset);

  return NextResponse.json({
    staff,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}