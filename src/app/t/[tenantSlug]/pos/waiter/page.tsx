"use client";

import { useRouter } from "next/navigation";
import React, { use } from "react";

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
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e5b83b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M4 18v3M20 18v3M3 8h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8zM12 14v4M8 18h8" />
      </svg>
    ),
  },
  {
    key: "history",
    label: "History",

    href: `/t/${tenantSlug}/pos/waiter/waiter-history`, 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e5b83b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
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

        <div className="flex justify-end">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 text-neutral-500 hover:text-red-400 border border-neutral-800 hover:border-red-400/30 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>

      </main>
    </div>
  );
}