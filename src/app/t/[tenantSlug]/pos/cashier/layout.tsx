"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";


const ROLE_HOME: Record<string, string> = {
  Owner: "org",
  Manager: "manager",
  Cashier: "pos/cashier",
  Waiter: "pos/waiter",
  "Kitchen Crew": "pos/kitchen",
};


export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "Cashier") {
    const home = ROLE_HOME[role ?? ""] ?? "pos/cashier";
      router.replace(`/t/${tenantSlug}/${home}`);
    } else {
      setChecked(true);
    }
  }, [router, tenantSlug]);

  if (!checked) return null; // or a loading spinner

  return <>{children}</>;
}