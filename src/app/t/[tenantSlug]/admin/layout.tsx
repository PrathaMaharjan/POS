import Sidebar from "./components/Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>; 
}

// export default async function TenantLayout({ children, params }: LayoutProps) {
 
//   const { tenantSlug } = await params;

//   return (
//     <div className="flex min-h-screen bg-black">
  
//       <Sidebar tenantSlug={tenantSlug} />

//       <main className="flex-1 overflow-y-auto">
//         {children}
//       </main>
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  Owner: "admin",
  Manager: "admin",
  Cashier: "pos/cashier",
  Waiter: "waiter",
  "Kitchen Crew": "kitchen",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [checked, setChecked] = useState(false);
  
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "Owner" && role !== "Manager") {
      const home = ROLE_HOME[role ?? ""] ?? "pos/cashier";
      router.replace(`/t/${tenantSlug}/${home}`);
    } else {
      setChecked(true);
    }
  }, [router, tenantSlug]);

  if (!checked) return null;

  return (
      <div className="flex min-h-screen bg-black">
  
      <Sidebar tenantSlug={tenantSlug} />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}