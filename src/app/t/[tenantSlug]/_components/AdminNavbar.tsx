"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  Package,
  Menu,
  X,
} from "lucide-react";

interface NavbarProps {
  role: "org" | "manager";
}

export default function AdminNavbar({ role }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenantSlug } = useParams();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Close side menu drawer on path updates automatically
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const baseUrl = `/t/${tenantSlug}/${role}`;

  const navItems = [
    { label: "Overview", href: baseUrl, icon: LayoutDashboard },
    { label: "Manage Staff", href: `${baseUrl}/staff`, icon: Users },
  ];

  if (role === "manager") {
    navItems.push({ label: "Menu", href: `${baseUrl}/menu`, icon: UtensilsCrossed });
    navItems.push({ label: "Tables", href: `${baseUrl}/tables`, icon: Layers });
    navItems.push({ label: "Orders", href: `${baseUrl}/orders`, icon: ShoppingBag });
    navItems.push({ label: "Payments", href: `${baseUrl}/payments`, icon: CreditCard });
    navItems.push({ label: "Inventory", href: `${baseUrl}/inventory`, icon: Package });
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
    <>
      {/* Top Header Bar for Mobile Screens */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-slate-400 uppercase tracking-wider leading-none mb-1">
            {tenantSlug}
          </span>
          <span className="text-sm font-bold text-slate-800 capitalize">
            {role === "org" ? "Org Admin" : "Manager Portal"}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Navigation Sidebar (Desktop Standard + Mobile Slideout Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo & Info Identity Section */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 md:h-auto md:py-5">
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-slate-800 tracking-tight capitalize leading-none mb-0.5">
              {tenantSlug}
            </span>
            <span className="text-xs font-medium text-emerald-600 capitalize">
              {role === "org" ? "Organization Admin" : "Manager Portal"}
            </span>
          </div>
          {/* Close button inside drawer - mobile only */}
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden"
            aria-label="Close Navigation Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary Navigation links list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const IconComponent = item.icon as any;
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

        {/* Footer Actions Panel */}
        <div className="flex flex-col gap-1 border-t border-slate-200 px-4 py-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-60"
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


      <div className="h-16 md:hidden" />
    </>
  );
}