"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

// const ROLE_HOME: Record<string, string> = {
//   Owner: "admin",
//   Manager: "admin",
//   Cashier: "cashier",
//   Waiter: "waiter",
//   "Kitchen Crew": "kitchen",
// };
const ROLE_HOME: Record<string, string> = {
  Owner: "admin/dashboard",
  Manager: "admin/dashboard",
  Cashier: "cashier",
  Waiter: "waiter",
  "Kitchen Crew": "kitchen",
};


export default function WaiterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "Waiter") {
      const home = ROLE_HOME[role ?? ""] ?? "admin";
      router.replace(`/t/${tenantSlug}/${home}`);
    } else {
      setChecked(true);
    }
  }, [router, tenantSlug]);

  if (!checked) return null;

  return <>{children}</>;
}