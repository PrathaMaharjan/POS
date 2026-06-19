"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminNavbar from "@/app/t/[tenantSlug]/_components/AdminNavbar";

const ROLE_HOME: Record<string, string> = {
  Owner: "org",
  Manager: "manager",
  Cashier: "pos/cashier",
  Waiter: "pos/waiter",
  "Kitchen Crew": "pos/kitchen",
};

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "Owner") {
      const home = ROLE_HOME[role ?? ""] ?? "org";
      router.replace(`/t/${tenantSlug}/${home}`);
    } else {
      setChecked(true);
    }
  }, [router, tenantSlug]);

  if (!checked) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased flex">
      <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-slate-200 bg-white">
        <AdminNavbar role="org" />
      </aside>

      <div className="flex-1 pl-64">
        <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}