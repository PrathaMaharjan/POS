"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import {
  TrendingUp, Users, ShoppingBag, RefreshCw,
  Star, AlertTriangle, BarChart3,
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

type Period = "hourly" | "weekly" | "monthly";

const PERIODS: { value: Period; label: string; description: string }[] = [
  { value: "hourly",  label: "24H", description: "Today by hour" },
  { value: "weekly",  label: "7D",  description: "Last 7 days"   },
  { value: "monthly", label: "30D", description: "Last 4 weeks"  },
];

function getAxisLabel(label: string, period: Period): string {
  if (period === "weekly")  return label.slice(0, 3);
  if (period === "monthly") return label.replace("Week ", "W");
  return label;
}

export default function OverviewPage() {
  const [period, setPeriod]             = useState<Period>("hourly");
  const [data, setData]                 = useState<DashboardData | null>(null);
  const [salesTrend, setSalesTrend]     = useState<SalesTrendItem[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const isFirstLoad = useRef(true);

  // ── 1. Initial load — full dashboard ──────────────
  const fetchDashboard = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await api.get("/dashboard/manager");
      setData(res.data);
      setSalesTrend(res.data.salesTrend ?? []); // hourly trend from dashboard
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // ── 2. Period change — only fetch trend ───────────
  const fetchTrend = useCallback(async (p: Period) => {
    setIsTrendLoading(true);
    setError(null);

    try {
      const res = await api.get(`/reports/sales-trend?period=${p}`);
      setSalesTrend(res.data.salesTrend ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to load trend data.");
    } finally {
      setIsTrendLoading(false);
    }
  }, []);

  // ── On mount — full dashboard load ────────────────
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── On period change — only trend ─────────────────
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return; // skip on first render — dashboard fetch handles it
    }
    fetchTrend(period);
  }, [period, fetchTrend]);

  // ── Derived values ─────────────────────────────────
  const maxSalesValue = salesTrend.length
    ? Math.max(...salesTrend.map((s) => s.total), 1)
    : 1;

  const totalOrders = salesTrend.reduce((acc, s) => acc + s.count, 0);

  const trendRevenue = salesTrend.reduce((acc, s) => acc + s.total, 0);

  const currentPeriod = PERIODS.find((p) => p.value === period)!;

  const chartLoading = isLoading || isTrendLoading;

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-emerald-100/80 mt-1">
            Welcome back! Here is a summary of your outlet's performance.
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 p-1 rounded-xl flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              disabled={chartLoading}
              className={`font-bold text-xs px-4 py-1.5 rounded-lg transition-all disabled:opacity-60 ${
                period === p.value
                  ? "bg-white text-emerald-700"
                  : "text-emerald-100 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Total Revenue */}
        <div className="rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Revenue
            </p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {isLoading
                ? <span className="text-xl text-slate-300 animate-pulse">Loading...</span>
                : `Rs. ${(data?.totalRevenue ?? 0).toLocaleString()}`
              }
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Active Staff — hardcoded */}
        <div className="rounded-xl border-l-4 border-l-blue-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Active Staff
            </p>
            <p className="text-3xl font-bold text-slate-800 mt-1">3</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Orders
            </p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {isLoading
                ? <span className="text-xl text-slate-300 animate-pulse">Loading...</span>
                : totalOrders
              }
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sales Trend */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-4">

          {/* Chart header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Sales Trend</span>
                <span className="text-xs text-slate-400">— {currentPeriod.description}</span>
              </div>

              {!chartLoading && salesTrend.length > 0 && (
                <div className="flex items-center gap-3 mt-1 pl-9">
                  <span className="text-xs text-slate-500">
                    <span className="font-bold text-slate-800">
                      Rs. {trendRevenue.toLocaleString()}
                    </span>{" "}revenue
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-500">
                    <span className="font-bold text-slate-800">{totalOrders}</span> orders
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => fetchDashboard(true)}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Bars */}
          {chartLoading ? (
            <div className="flex items-end justify-between h-44 gap-2 px-1">
              {[45, 65, 40, 80, 55, 70, 50].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 bg-slate-100 animate-pulse rounded-t-md"
                />
              ))}
            </div>
          ) : salesTrend.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center gap-2 text-slate-400">
              <BarChart3 className="w-8 h-8 opacity-20" />
              <p className="text-xs font-medium">No sales data for this period.</p>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between h-44 gap-2 px-1 border-b border-slate-100 pb-1">
                {salesTrend.map((item, idx) => {
                  const heightPct = Math.max((item.total / maxSalesValue) * 100, 3);
                  const isMax = item.total === maxSalesValue;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip */}
                      <div className="
                        absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2
                        hidden group-hover:flex flex-col items-center
                        bg-slate-900 text-white rounded-lg shadow-xl
                        px-3 py-2 whitespace-nowrap z-20 text-center
                        pointer-events-none
                      ">
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                        <span className="text-[11px] font-semibold text-slate-300">
                          {item.label}
                        </span>
                        <span className="text-sm font-bold text-emerald-400">
                          Rs. {item.total.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.count} {item.count === 1 ? "order" : "orders"}
                        </span>
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`
                          w-full rounded-t-md border-t-2 transition-all duration-300 cursor-pointer
                          ${isMax
                            ? "bg-emerald-200 border-emerald-600 group-hover:bg-emerald-300"
                            : "bg-emerald-100 border-emerald-400 group-hover:bg-emerald-200"
                          }
                        `}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-axis */}
              <div className="flex justify-between items-center px-1 gap-1">
                {salesTrend.map((item, idx) => (
                  <span
                    key={idx}
                    className="flex-1 text-center text-[10px] text-slate-400 font-mono truncate"
                  >
                    {getAxisLabel(item.label, period)}
                  </span>
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
                <div
                  key={i}
                  className="h-12 bg-slate-50 animate-pulse rounded-lg border border-slate-100 mb-2"
                />
              ))
            ) : !data || data.topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-400">
                <Star className="w-8 h-8 opacity-20" />
                <p className="text-xs font-medium">No sales data yet.</p>
              </div>
            ) : (
              data.topProducts.map((prod, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-700 border border-emerald-100 shrink-0">
                      {prod.rank}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700 capitalize">
                        {prod.name}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        {prod.totalSold} sold
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 shrink-0">
                    Rs. {prod.totalRevenue.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Alerts
        </div>
        <div>
          <p className="text-xs text-slate-400 text-center py-6">No alerts right now.</p>
        </div>
      </div>

    </div>
  );
}