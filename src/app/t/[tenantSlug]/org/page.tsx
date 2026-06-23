"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Store,
  TrendingUp,
  ArrowUpRight,
  Shield,
  PlusCircle,
  Layers,
  CreditCard,
  Settings,
  Bell,
  RefreshCw,
  Printer,
  Wifi,
  Activity,
  ChevronRight,
  Coffee,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";

// Mock Recent Activities across branches
const ACTIVITIES = [
  { id: 1, time: "3 mins ago", branch: "Lalitpur Hub", type: "order", detail: "Order #1405 completed", amount: "Rs. 1,450", status: "completed" },
  { id: 2, time: "12 mins ago", branch: "Kathmandu Main", type: "shift", detail: "Shift opened by Kang Roy", amount: null, status: "info" },
  { id: 3, time: "25 mins ago", branch: "Pokhara Lakeside", type: "order", detail: "Order #1404 completed", amount: "Rs. 2,100", status: "completed" },
  { id: 4, time: "45 mins ago", branch: "Kathmandu Main", type: "order", detail: "Order #1403 cancelled", amount: "Rs. 450", status: "cancelled" },
  { id: 5, time: "1 hour ago", branch: "Pokhara Lakeside", type: "table", detail: "Table T-3 reserved for 4 guests", amount: null, status: "reserved" },
  { id: 6, time: "2 hours ago", branch: "Lalitpur Hub", type: "menu", detail: "Menu item 'Iced Matcha' price updated", amount: null, status: "info" }
];

export default function OverviewPage() {
  const { tenantSlug } = useParams();
  const baseUrl = `/t/${tenantSlug}/org`;
  const [activeAlerts, setActiveAlerts] = useState(3);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Trigger simulated refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 p-4 sm:p-0">
      
      {/* Header Banner */}
      <div className="rounded-xl bg-emerald-600 px-5 py-5 md:px-6 md:py-6 text-white shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organization Overview</h1>
          <p className="text-xs md:text-sm text-emerald-100 mt-1">
            Welcome back, admin! Manage active branches, review performance reports, and control organizational configurations.
          </p>
        </div>

        {/* Quick action controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className={`rounded-lg bg-emerald-700/80 p-2.5 text-emerald-100 hover:bg-emerald-700 hover:text-white transition-colors border border-emerald-500/20 ${isRefreshing ? "animate-spin" : ""}`}
            title="Refresh Data"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
          
          <Link
            href={`${baseUrl}/reports`}
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs md:text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 hover:scale-[1.02]"
          >
            <Activity className="h-4 w-4" />
            View Reports
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Net Combined Revenue", value: "Rs. 1,071,500", border: "border-l-[#18a172]", iconBg: "bg-[#f0fdf4] text-[#0f6b4a]", icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Active Directory Staff", value: "8 Operators", border: "border-l-indigo-500", iconBg: "bg-indigo-50 text-indigo-600", icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Registered Outlets", value: "3 Branches", border: "border-l-slate-400", iconBg: "bg-slate-50 text-slate-600", icon: <Store className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Alerts & Notifications", value: `${activeAlerts} Active`, border: "border-l-amber-500", iconBg: "bg-amber-50 text-amber-600", icon: <Bell className="h-5 w-5 sm:h-6 sm:w-6" /> }
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border-l-4 ${s.border} border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between`}
          >
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl sm:text-2xl font-semibold text-slate-800 mt-1 break-all">{s.value}</p>
            </div>
            <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Weekly Revenue Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Outlets Revenue Comparison (SVG Donut Chart Widget) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Weekly Outlet Sales Share</h2>
            <p className="text-xs text-slate-400 mt-0.5">Revenue generated by branch during the last 7 days</p>
          </div>

          {/* SVG Donut Chart layout */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-3 flex-1">
            
            {/* Donut graphic */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg width="160" height="160" viewBox="0 0 120 120" className="-rotate-90 w-full h-full">
                {/* Background circle */}
                <circle cx="60" cy="60" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                
                {/* Kathmandu Segment (39.7%) - length 112.25 */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="transparent"
                  stroke="#0f6b4a"
                  strokeWidth="12"
                  strokeDasharray="112.25 282.74"
                  strokeDashoffset="0"
                />

                {/* Pokhara Segment (33.3%) - length 94.15 */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="transparent"
                  stroke="#2563eb"
                  strokeWidth="12"
                  strokeDasharray="94.15 282.74"
                  strokeDashoffset="-112.25"
                />

                {/* Lalitpur Segment (27.0%) - length 76.34 */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="transparent"
                  stroke="#4f46e5"
                  strokeWidth="12"
                  strokeDasharray="76.34 282.74"
                  strokeDashoffset="-206.40"
                />
              </svg>

              {/* Central text display */}
              <div className="absolute text-center flex flex-col justify-center items-center">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Combined</span>
                <span className="text-base font-bold text-slate-800 mt-0.5">Rs. 1.07M</span>
              </div>
            </div>

            {/* Color-coded branch list */}
            <div className="flex-1 w-full space-y-3.5">
              {[
                { name: "Kathmandu Main Branch", revenue: 425800, percent: 39.7, color: "bg-[#0f6b4a]", text: "text-[#0f6b4a]" },
                { name: "Pokhara Lakeside", revenue: 356200, percent: 33.3, color: "bg-blue-600", text: "text-blue-600" },
                { name: "Lalitpur Hub", revenue: 289500, percent: 27.0, color: "bg-indigo-600", text: "text-indigo-600" }
              ].map((branch) => (
                <div key={branch.name} className="flex items-center justify-between text-xs sm:text-sm border-b border-slate-50 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3 pr-2">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${branch.color}`} />
                    <span className="font-semibold text-slate-700 truncate max-w-[150px] sm:max-w-none">{branch.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800 font-mono">Rs. {branch.revenue.toLocaleString()}</span>
                    <span className="text-slate-400 text-[10px] block mt-0.5 font-semibold font-sans">{branch.percent}% Share</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Quick Config / Navigation Dashboard */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-semibold text-slate-700">Quick Operations Panel</h2>
            <p className="text-xs text-slate-400 mt-0.5">Direct gateway link actions</p>
          </div>

          {/* Quick actions links */}
          <div className="grid grid-cols-2 gap-3 flex-1 py-1">
            {[
              { label: "New Outlet", href: `${baseUrl}/outlets`, icon: <Store className="w-4 h-4 text-emerald-600" />, desc: "Register a branch" },
              { label: "Add Staff", href: `${baseUrl}/staff`, icon: <PlusCircle className="w-4 h-4 text-indigo-600" />, desc: "Enroll personnel" },
              { label: "Edit Tables", href: `${baseUrl}/tables`, icon: <Layers className="w-4 h-4 text-blue-600" />, desc: "Shape layouts" },
              { label: "Payments Log", href: `${baseUrl}/payments`, icon: <CreditCard className="w-4 h-4 text-purple-600" />, desc: "Transaction logs" }
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group border border-slate-100 hover:border-emerald-100 rounded-xl p-3 flex flex-col justify-between bg-slate-50/50 hover:bg-emerald-50/20 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-200/50">
                    {action.icon}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div className="mt-3">
                  <span className="text-xs font-semibold text-slate-800 block">{action.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{action.desc}</span>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href={`${baseUrl}/menu`}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-[#0f6b4a] hover:text-white py-3 text-xs font-semibold text-slate-700 transition-all"
          >
            <Coffee className="w-4 h-4" />
            Launch Menu Configurator
          </Link>
        </div>

      </div>

      {/* Grid: Recent Live Activity + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Activity Stream */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Live Cross-Outlet Events</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time action logs across connected branches</p>
            </div>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
            {ACTIVITIES.map((act) => (
              <div key={act.id} className="flex items-start justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 text-xs">
                <div className="flex gap-3">
                  {/* Status Indicator circle */}
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    act.status === "completed" 
                      ? "bg-emerald-500" 
                      : act.status === "cancelled" 
                        ? "bg-red-500" 
                        : act.status === "reserved" 
                          ? "bg-blue-500" 
                          : "bg-indigo-500"
                  }`} />
                  <div>
                    <p className="font-medium text-slate-700">{act.detail}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
                      <span className="font-semibold text-slate-500 uppercase tracking-wider">{act.branch}</span>
                      <span>•</span>
                      <span>{act.time}</span>
                    </div>
                  </div>
                </div>

                {/* Amount display */}
                {act.amount && (
                  <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {act.amount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* System & Hardware Health Grid */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-semibold text-slate-700">System Gateway Monitor</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live status checks of core infrastructure</p>
          </div>

          <div className="space-y-3 flex-1 justify-center flex flex-col">
            {[
              { label: "Database Synchronization", status: "Fully Synced", icon: <RefreshCw className="w-4 h-4 text-emerald-600" /> },
              { label: "Shift Logs Status", status: "Active (Nepal Time)", icon: <Clock className="w-4 h-4 text-emerald-600" /> },
              { label: "Receipt Printer Gateway", status: "Online / Standby", icon: <Printer className="w-4 h-4 text-emerald-600" /> },
              { label: "WebSocket Gateway Client", status: "Connected", icon: <Wifi className="w-4 h-4 text-emerald-600" /> }
            ].map((hw) => (
              <div key={hw.label} className="flex items-center justify-between border border-slate-100 bg-slate-50/50 rounded-xl px-4 py-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-md bg-white border border-slate-200/50">
                    {hw.icon}
                  </div>
                  <span className="font-semibold text-slate-600">{hw.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-700 text-[10px] uppercase">{hw.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick info panel footer */}
          <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-xl px-4 py-3 flex items-center justify-between text-[10px] font-semibold text-emerald-800 mt-2">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Role Permission Access: Owner
            </span>
            <span className="text-slate-400">Ver 1.0.4</span>
          </div>
        </div>

      </div>

    </div>
  );
}