import { createStaff, listStaff } from "@/controller/staff";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["Cashier", "Waiter", "Kitchen Crew"]),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.users.create");
  if (permError) return permError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createStaff(
    auth.payload.organizationId,
    auth.payload.activeOutletId!,
    parsed.data,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: 201 });
}


export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.users.read");
  if (permError) return permError;

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100); // cap at 100
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const offset = (page - 1) * limit;

  const { staff, total } = await listStaff(auth.payload.activeOutletId!, limit, offset);

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