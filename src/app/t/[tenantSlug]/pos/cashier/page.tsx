"use client";

import { useRouter } from "next/navigation";
import React, { use, useState, useEffect } from "react";
import api from '@/lib/api';
import {
  ShoppingBag,
  Utensils,
  FileText,
  Maximize2,
  Minimize2,
  LogOut,
  Settings
} from "lucide-react";
import SettingsDrawer from "../_components/SettingsDrawer";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

interface CashierDashboardProps {
  params: Promise<{ tenantSlug: string }>;
}

function CashierDashboardInner({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (err) {
      console.error(err);
    }
  };

  const accent = isDark ? '#e5b83b' : '#16a34a';

  const modules = [
    { key: "takeaway", label: "Takeaway", href: `/t/${tenantSlug}/pos/cashier/takeaway`, icon: ShoppingBag },
    { key: "dine-in", label: "Dine-In", href: `/t/${tenantSlug}/pos/cashier/dinein`, icon: Utensils },
    { key: "history", label: "History", href: `/t/${tenantSlug}/pos/cashier/history`, icon: FileText },
  ];

  return (
    <div style={{
      backgroundColor: isDark ? '#0c0c0d' : '#ffffff',
      color: isDark ? '#e4e4e7' : '#171717',
    }} className="h-screen w-full min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-200">

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-8 pt-6 flex justify-end shrink-0">
        <button
          onClick={() => setIsSettingsOpen(true)}
          style={{
            backgroundColor: isDark ? '#141416' : '#f0fdf4',
            borderColor: isDark ? '#27272a' : '#bbf7d0',
            color: isDark ? '#a1a1aa' : '#15803d',
          }}
          className="p-2.5 border rounded-xl transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm"
          title="Open Settings"
        >
          <Settings className="w-5 h-5" strokeWidth={2} />
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-8 pb-12 pt-2 flex flex-col justify-between gap-12 overflow-hidden">

        <div className="space-y-2">
          <h1 style={{ color: isDark ? '#ffffff' : '#14532d' }} className="text-4xl text-center sm:text-5xl font-bold">
            WELCOME BACK
          </h1>
          <p style={{ color: isDark ? '#a1a1aa' : '#4b7a58' }} className="text-center text-lg font-normal">
            Select a service module to begin.
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto w-full">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.key}
                onClick={() => router.push(mod.href)}
                style={{
                  backgroundColor: isDark ? '#18181b' : '#f0fdf4',
                  borderColor: isDark ? '#27272a' : '#bbf7d0',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = accent;
                  el.style.transform = 'translateY(-4px)';
                  el.style.boxShadow = isDark
                    ? '0 0 30px rgba(229,184,59,0.08)'
                    : '0 10px 30px rgba(22,163,74,0.1)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = isDark ? '#27272a' : '#bbf7d0';
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                }}
                className="group relative h-[380px] rounded-2xl border p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 overflow-hidden"
              >
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    style={{
                      borderColor: isDark ? 'rgba(229,184,59,0.2)' : 'rgba(22,163,74,0.25)',
                      backgroundColor: isDark ? 'rgba(229,184,59,0.05)' : 'rgba(22,163,74,0.08)',
                    }}
                    className="w-20 h-20 rounded-full border-2 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                  >
                    <Icon className="w-8 h-8" style={{ color: accent }} strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-wide" style={{ color: accent }}>
                    {mod.label}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-end items-center gap-3">
          <button
            onClick={toggleFullscreen}
            style={{
              borderColor: isDark ? '#27272a' : '#bbf7d0',
              color: isDark ? '#a1a1aa' : '#15803d',
              backgroundColor: isDark ? 'transparent' : '#f0fdf4',
            }}
            className="flex items-center gap-2 border px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 shadow-sm hover:opacity-80"
          >
            {isFullscreen
              ? <><Minimize2 className="w-4 h-4" strokeWidth={2} /> Exit Full</>
              : <><Maximize2 className="w-4 h-4" strokeWidth={2} /> Fullscreen</>
            }
          </button>

          <button
            onClick={async () => {
              try {

                await api.post("/auth/logout");
              } catch (err) {
                console.error("Failed to invalidate session on backend:", err);
              } finally {

                router.push("/login");
              }
            }}
            style={{
              borderColor: isDark ? '#27272a' : '#fecaca',
              color: isDark ? '#a1a1aa' : '#ef4444',
              backgroundColor: isDark ? 'transparent' : '#fff5f5',
            }}
            className="flex items-center gap-2 border px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 shadow-sm hover:opacity-80"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            Logout
          </button>
        </div>

      </main>

      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function CashierDashboard({ params }: CashierDashboardProps) {
  const { tenantSlug } = use(params);
  return (
    <ThemeProvider role="cashier">
      <CashierDashboardInner tenantSlug={tenantSlug} />
    </ThemeProvider>
  );
}