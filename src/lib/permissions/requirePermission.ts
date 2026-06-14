import { NextResponse } from "next/server";
import { AccessTokenPayload } from "../auth/jwt";


export function requiredPermission(
  payload: AccessTokenPayload,
  permissionCode: string,
): NextResponse | null {
  if (!payload.activeOutletId) {
    return NextResponse.json(
      { error: "No active outlet selected" },
      { status: 400 },
    );
  }
  if(!payload.permissions.includes(permissionCode)){
    return NextResponse.json({ error: "Forbidden: missing permission " + permissionCode }, { status: 403 });

  }
  return null
}
