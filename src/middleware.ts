import { NextRequest, NextResponse } from "next/server";

const ROUTE_ROLE_MAP: Record<string, string[]> = {
  admin: ["Owner", "Manager"],
  kitchen: ["Kitchen Crew"],
  waiter: ["Waiter"],
  "pos/cashier": ["Cashier"],
};

const ROLE_HOME: Record<string, string> = {
  Owner: "admin",
  Manager: "admin",
  Cashier: "pos/cashier",
  Waiter: "waiter",
  "Kitchen Crew": "kitchen",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const match = pathname.match(/^\/t\/([^/]+)\/(.+)$/);
  if (!match) return NextResponse.next();

  const [, tenantSlug, rest] = match;
  const role = req.cookies.get("role")?.value;

  if (!role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const matchedRoute = Object.keys(ROUTE_ROLE_MAP)
    .filter((route) => rest === route || rest.startsWith(route + "/"))
    .sort((a, b) => b.length - a.length)[0];

  if (matchedRoute) {
    const allowedRoles = ROUTE_ROLE_MAP[matchedRoute];
    if (!allowedRoles.includes(role)) {
      const home = ROLE_HOME[role] ?? "admin";
      return NextResponse.redirect(new URL(`/t/${tenantSlug}/${home}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/t/:path*"],
};