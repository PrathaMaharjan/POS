import { NextRequest, NextResponse } from "next/server";

const ROUTE_ROLE_MAP: Record<string, string[]> = {
  org: ["Owner"],
  manager: ["Manager"],
  "pos/cashier": ["Cashier"],
  "pos/waiter": ["Waiter"],
  "pos/kitchen": ["Kitchen Crew"],
};

const ROLE_HOME: Record<string, string> = {
  Owner: "org",
  Manager: "manager",
  Cashier: "pos/cashier",
  Waiter: "pos/waiter",
  "Kitchen Crew": "pos/kitchen",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  /**
   * Use a Regular Expression to check if the path matches a multi-tenant pattern.
   * It looks for paths starting with "/t/", extracts the tenant name, and captures the remaining path.
   * Example: "/t/mcdonalds/kitchen/orders"
   * - match[1] (tenantSlug) = "mcdonalds"
   * - match[2] (rest)       = "kitchen/orders"
   */
  const match = pathname.match(/^\/t\/([^/]+)\/(.+)$/);
  if (!match) return NextResponse.next();

  // Destructure the regex match array. The first element is ignored, the 2nd is tenantSlug, and the 3rd is the rest of the path.
  const [, tenantSlug, rest] = match;
  const role = req.cookies.get("role")?.value;

  if (!role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  /**
   * Find which defined route rule matches the current requested path ('rest').
   * 1. Object.keys(ROUTE_ROLE_MAP) gets all protected route prefixes (['admin', 'kitchen', ...]).
   * 2. .filter(...) checks if the current sub-path exactly equals a rule OR starts with that rule followed by a slash (e.g., 'kitchen/orders' matches 'kitchen').
   * 3. .sort(...) sorts matching rules by string length in descending order so that the most specific/deepest rule matches first.
   * 4. [0] grabs the top/best matching route configuration.
   */
  const matchedRoute = Object.keys(ROUTE_ROLE_MAP)
    .filter((route) => rest === route || rest.startsWith(route + "/"))
    .sort((a, b) => b.length - a.length)[0];

  if (matchedRoute) {
    const allowedRoles = ROUTE_ROLE_MAP[matchedRoute];
    if (!allowedRoles.includes(role)) {
      const home = ROLE_HOME[role] ?? "admin";
      return NextResponse.redirect(
        new URL(`/t/${tenantSlug}/${home}`, req.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/t/:path*"],
};
