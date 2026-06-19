"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminNavbar from "../_components/AdminNavbar";

const ROLE_HOME: Record<string, string> = {
  Owner: "org",
  Manager: "manager",
  Cashier: "pos/cashier",
  Waiter: "pos/waiter",
  "Kitchen Crew": "pos/kitchen",
};

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "Manager") {
      const home = ROLE_HOME[role ?? ""] ?? "manager";
      router.replace(`/t/${tenantSlug}/${home}`);
    } else {
      setChecked(true);
    }
  }, [router, tenantSlug]);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen bg-white text-slate-900">
      <AdminNavbar role="manager" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-white">
        {children}
      </main>
    </div>
  );
}