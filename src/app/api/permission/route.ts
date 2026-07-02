import {  getRolePermissions, togglePermission } from "@/controller/permission/controller";
import { requiredToken } from "@/lib/auth/requireAuth";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const toggleSchema = z.object({
  roleId:       z.string().uuid(),
  permissionId: z.string().uuid(),
  isEnabled:    z.boolean(),
});

export async function GET(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.roles.read");
  if (permError) return permError;

  const roleId   = req.nextUrl.searchParams.get("roleId");
  const outletId = req.nextUrl.searchParams.get("outletId") ?? undefined; // ← add

  if (!roleId) {
    return NextResponse.json({ error: "roleId is required" }, { status: 400 });
  }

  const result = await getRolePermissions(
    auth.payload.organizationId,
    roleId,
    outletId  // ← pass through
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}

export async function PATCH(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "core.roles.update");
  if (permError) return permError;

  const toggleSchema = z.object({
    roleId:       z.string().uuid(),
    permissionId: z.string().uuid(),
    isEnabled:    z.boolean(),
    outletId:     z.string().uuid().optional(), // ← add
  });

  const body   = await req.json();
  const parsed = toggleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await togglePermission(
    auth.payload.organizationId,
    parsed.data.roleId,
    parsed.data.permissionId,
    parsed.data.isEnabled,
    parsed.data.outletId  // ← pass through
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}