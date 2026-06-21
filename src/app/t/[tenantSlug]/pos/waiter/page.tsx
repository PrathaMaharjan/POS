"use client";

import { useRouter } from "next/navigation";
import React, { use } from "react";
import { Utensils, FileText, LogOut } from "lucide-react";
import api from "@/lib/api"; 

interface WaiterDashboardProps {
  params: Promise<{ tenantSlug: string }>;
}

export default function WaiterDashboard({ params }: WaiterDashboardProps) {
  const router = useRouter();
  const { tenantSlug } = use(params);

  const modules = [
    {
      key: "dine-in",
      label: "Dine-In",
      href: `/t/${tenantSlug}/pos/waiter/waiter-dinein`,
      icon: <Utensils className="w-8 h-8 stroke-[#e5b83b]" strokeWidth={2} />,
    },
    {
      key: "history",
      label: "History",
      href: `/t/${tenantSlug}/pos/waiter/waiter-history`,
      icon: <FileText className="w-8 h-8 stroke-[#e5b83b]" strokeWidth={2} />,
    },
  ];

  return (
    <div className="h-screen w-full min-h-screen bg-[#0c0c0d] text-[#e4e4e7] flex flex-col font-sans select-none antialiased">
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-12 flex flex-col justify-between gap-12">

        <div className="space-y-2">
          <h1 className="text-4xl text-center sm:text-5xl font-semibold text-white tracking-wide">
            WELCOME BACK
          </h1>
          <p className="text-neutral-400 text-center text-lg font-normal">
            Select a service module to begin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto w-full max-w-4xl mx-auto">
          {modules.map((mod) => (
            <div
              key={mod.key}
              onClick={() => router.push(mod.href)}
              className="group relative h-[380px] rounded-2xl bg-gradient-to-b from-[#18181b] to-[#121214] border border-neutral-800 hover:border-[#e5b83b]/50 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(229,184,59,0.06)] hover:-translate-y-1 overflow-hidden"
            >
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#e5b83b]/20 bg-[#e5b83b]/5 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:border-[#e5b83b] group-hover:bg-[#e5b83b]/10 group-hover:shadow-[0_0_20px_rgba(229,184,59,0.15)]">
                  {mod.icon}
                </div>
                <h3 className="text-2xl font-semibold text-[#e5b83b] tracking-wide transition-colors duration-300">
                  {mod.label}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar / Logout */}
        <div className="flex justify-end">
          <button
            onClick={async () => {
              try {
                // Hits your API route to clear cookies and set revoked: true in the database
                await api.post("/auth/logout");
              } catch (err) {
                console.error("Failed to invalidate session on backend:", err);
              } finally {
                // Safeguard to ensure user is always redirected even if network hiccups
                router.push("/login");
              }
            }}
            className="flex items-center gap-2 text-neutral-500 hover:text-red-400 border border-neutral-800 hover:border-red-400/30 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            Logout
          </button>
        </div>

      </main>
    </div>
  );
}