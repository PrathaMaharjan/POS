"use client";

import { LayoutGrid, Users, Store, TrendingUp } from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-emerald-100 mt-1">
          Welcome back! Here is a summary of your organization's current performance.
        </p>
      </div>

      {/* Metrics Grid Placeholder */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-xl font-semibold text-slate-800">Rs. 0.00</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Staff</p>
            <p className="text-xl font-semibold text-slate-800">3</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Outlets</p>
            <p className="text-xl font-semibold text-slate-800">1</p>
          </div>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center text-slate-400 text-sm">
        Analytics graphs, recent activity logs, and real-time order streams will populate here.
      </div>
    </div>
  );
}