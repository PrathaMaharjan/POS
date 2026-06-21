"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import {
  Users,
  Store,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingBag,
  CreditCard,
  Loader2,
  UtensilsCrossed,
  Layers,
} from "lucide-react";

interface NavbarProps {
  role: "org" | "manager";
}

export default function AdminNavbar({ role }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenantSlug } = useParams();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const baseUrl = `/t/${tenantSlug}/${role}`;

  const navItems = [
    { label: "Overview", href: baseUrl, icon: LayoutDashboard },
    { label: "Manage Staff", href: `${baseUrl}/staff`, icon: Users },
  ];

 if (role === "manager") {
  navItems.push({ label: "Menu",     href: `${baseUrl}/menu`,     icon: UtensilsCrossed });
  navItems.push({ label: "Tables",   href: `${baseUrl}/tables`,   icon: Layers          });
  navItems.push({ label: "Orders",   href: `${baseUrl}/orders`,   icon: ShoppingBag     });
  navItems.push({ label: "Payments", href: `${baseUrl}/payments`, icon: CreditCard      });
}

  if (role === "org") {
    navItems.push({ label: "Outlets", href: `${baseUrl}/outlets`, icon: Store });
  }

  navItems.push({ label: "Settings", href: `${baseUrl}/settings`, icon: Settings });

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Failed to invalidate session on backend:", err);
    } finally {
      router.push("/login");
    }
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo & Context Section */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-slate-800 tracking-tight capitalize leading-none mb-0.5">
            {tenantSlug}
          </span>
          <span className="text-xs font-medium text-emerald-600 capitalize">
            {role === "org" ? "Organization Admin" : "Manager Portal"}
          </span>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const IconComponent = item.icon as any;
            
            // Exact path validation check supporting highlighting rules profiles
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <IconComponent
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Section */}
      <div className="flex flex-col gap-1 border-t border-slate-200 px-4 py-4">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-60 animate-none"
        >
          {isLoggingOut ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin text-rose-400" />
          ) : (
            <LogOut className="h-[18px] w-[18px] text-rose-400" />
          )}
          Logout
        </button>
      </div>
    </aside>
  );
}