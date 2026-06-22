"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api"; 
import {
  TrendingUp, Users, ShoppingBag, RefreshCw, Star, AlertTriangle, BarChart3,
} from "lucide-react";

interface TopProduct {
  rank: number;
  name: string;
  totalSold: number;
  totalRevenue: number;
}

interface SalesTrendItem {
  label: string;
  total: number;
  count: number;
}

interface DashboardData {
  totalRevenue: number;
  topProducts: TopProduct[];
  salesTrend: SalesTrendItem[];
}

const PERIOD_MAPPING = [
  { value: "hourly", label: "24H" },
  { value: "weekly", label: "7D" },
  { value: "monthly", label: "30D" },
];

export default function OverviewPage() {
  const [period, setPeriod] = useState<"hourly" | "weekly" | "monthly">("hourly");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboardData() {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get(`/dashboard/manager?period=${period}`);
      setData(res.data);
    } catch (err: any) {
      console.error("Error fetching dashboard details:", err);
      setError("Failed to load dashboard statistics.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const maxSalesValue = data?.salesTrend && data.salesTrend.length > 0
    ? Math.max(...data.salesTrend.map((s) => s.total), 1)
    : 1;


  const totalOrders = data?.salesTrend
    ? data.salesTrend.reduce((acc, curr) => acc + curr.count, 0)
    : 0;

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
          {PERIOD_MAPPING.map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value as any)}
              className={`font-bold text-xs px-4 py-1.5 rounded-lg transition-all ${
                period === item.value
                  ? "bg-white text-emerald-700"
                  : "text-emerald-100 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {isLoading ? (
                <span className="text-xl text-slate-300 animate-pulse">Loading...</span>
              ) : (
                `Rs. ${(data?.totalRevenue ?? 0).toLocaleString()}`
              )}
            </p>
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


        <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {isLoading ? (
                <span className="text-xl text-slate-300 animate-pulse">Loading...</span>
              ) : (
                totalOrders
              )}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Sales Trend ({PERIOD_MAPPING.find(p => p.value === period)?.label})
            </div>
            <button 
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {error ? (
            <div className="h-44 flex items-center justify-center text-xs text-red-500 font-medium">
              {error}
            </div>
          ) : isLoading ? (
            <div className="h-44 flex items-end justify-between gap-3 px-1 border-b border-slate-100 pb-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-1 bg-slate-100 animate-pulse rounded-t-sm" style={{ height: `${i * 15}%` }} />
              ))}
            </div>
          ) : !data || data.salesTrend.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-medium">
              No sales records found for this period.
            </div>
          ) : (
            <>

              <div className="flex-1 flex items-end justify-between h-44 gap-3 px-1 border-b border-slate-100 pb-1">
                {data.salesTrend.map((item, idx) => {
                  const percentage = (item.total / maxSalesValue) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">

                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-md whitespace-nowrap z-10 font-sans">
                        <span>Rs. {item.total.toLocaleString()}</span>
                        <span className="text-slate-300">({item.count} orders)</span>
                      </div>
                      <div
                        style={{ height: `${Math.max(percentage, 4)}%` }}
                        className="w-full bg-emerald-100 group-hover:bg-emerald-200 border-t-2 border-emerald-500 transition-all duration-300 rounded-t-sm cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis labels */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono tracking-wider px-1 overflow-x-auto gap-2">
                {data.salesTrend.map((item, idx) => (
                  <span key={idx} className="truncate text-center flex-1 min-w-[45px]">{item.label}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top Selling */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Star className="w-4 h-4 text-amber-500" />
            Popular Menu Items
          </div>

          <div className="flex-1 flex flex-col gap-1">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-lg border border-slate-100 mb-2" />
              ))
            ) : !data || data.topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No menu products yet.</p>
            ) : (
              data.topProducts.map((prod, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-700 border border-emerald-100">
                      {prod.rank || i + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700 capitalize">{prod.name}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">{prod.totalSold} sold</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">Rs. {prod.totalRevenue.toLocaleString()}</span>
                </div>
              ))
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
          <div className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">Low Stock</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Paneer is running low — 2 kg remaining.</p>
            </div>
          </div>
          <div className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">Pending Payments</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">3 payments awaiting confirmation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}