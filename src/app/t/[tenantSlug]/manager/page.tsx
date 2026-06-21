"use client";

import { useState } from "react";
import {
  TrendingUp, Users, Store, RefreshCw, Star, AlertTriangle, BarChart3,
} from "lucide-react";

const MOCK_TREND = [40, 55, 35, 70, 60, 80, 65];
const TIME_LABELS: Record<string, string[]> = {
  "24H": ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
  "7D":  ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "Yesterday", "Today"],
  "30D": ["Week 1", "Week 2", "Week 3", "Week 4"],
};

const MOCK_TOP_SELLING = [
  { name: "Chicken Momo", units: "42 sold", price: "Rs. 4,200" },
  { name: "Veg Thukpa",   units: "31 sold", price: "Rs. 3,100" },
  { name: "Cold Coffee",  units: "27 sold", price: "Rs. 1,890" },
];

const MOCK_ALERTS = [
  { id: 1, title: "Low Stock", desc: "Paneer is running low — 2 kg remaining." },
  { id: 2, title: "Pending Payments", desc: "3 payments awaiting confirmation." },
];

export default function OverviewPage() {
  const [timeFilter, setTimeFilter] = useState("24H");

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-emerald-100/80 mt-1">
            Welcome back! Here is a summary of your organization's current performance.
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 p-1 rounded-xl flex items-center gap-1">
          {["24H", "7D", "30D"].map((time) => (
            <button
              key={time}
              onClick={() => setTimeFilter(time)}
              className={`font-bold text-xs px-4 py-1.5 rounded-lg transition-all ${
                timeFilter === time
                  ? "bg-white text-emerald-700"
                  : "text-emerald-100 hover:text-white"
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">Rs. 0.00</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-blue-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Staff</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">3</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-slate-400 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Outlets</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">1</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <Store className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Trend Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sales Trend */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Sales Trend
            </div>
            <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="flex-1 flex items-end justify-between h-44 gap-3 px-1 border-b border-slate-100 pb-1">
            {MOCK_TREND.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                <div
                  style={{ height: `${val}%` }}
                  className="w-full bg-emerald-100 group-hover:bg-emerald-200 border-t-2 border-emerald-500 transition-all duration-300 rounded-t-sm"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono tracking-wider px-1">
            {TIME_LABELS[timeFilter].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>

        {/* Top Selling */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Star className="w-4 h-4 text-amber-500" />
            Popular Menu Items
          </div>

          <div className="flex-1 flex flex-col gap-1">
            {MOCK_TOP_SELLING.map((prod, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-700 border border-emerald-100">
                    {i + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700">{prod.name}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">{prod.units}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">{prod.price}</span>
              </div>
            ))}
            {MOCK_TOP_SELLING.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No menu products yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Alerts
        </div>

        <div className="space-y-2">
          {MOCK_ALERTS.map((alert) => (
            <div key={alert.id} className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700">{alert.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{alert.desc}</p>
              </div>
            </div>
          ))}
          {MOCK_ALERTS.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No alerts right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}