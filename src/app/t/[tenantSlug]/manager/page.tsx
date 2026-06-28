"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  TrendingUp, Users, ShoppingBag, RefreshCw,
  Star, AlertTriangle, BarChart3, ArrowRight, ChevronRight
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

interface LowStockItem {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  isOutOfStock: boolean;
}

interface DashboardData {
  totalRevenue: number;
  topProducts: TopProduct[];
  salesTrend: SalesTrendItem[];
  activeStaff: number;
  lowstock?: LowStockItem[];
}

type Period = "hourly" | "weekly" | "monthly";

const PERIODS: { value: Period; label: string; description: string }[] = [
  { value: "hourly", label: "24H", description: "Today by hour" },
  { value: "weekly", label: "7D", description: "Last 7 days" },
  { value: "monthly", label: "30D", description: "Last 4 weeks" },
];

function getAxisLabel(label: string, period: Period): string {
  if (period === "weekly") return label.slice(0, 3);
  if (period === "monthly") return label.replace("Week ", "W");
  return label;
}

export default function OverviewPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [period, setPeriod] = useState<Period>("hourly");
  const [data, setData] = useState<DashboardData | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  const isFirstLoad = useRef(true);


  const fetchDashboard = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await api.get("/dashboard/manager");
      setData(res.data);
      setSalesTrend(res.data.salesTrend ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);


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


  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);


  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    fetchTrend(period);
  }, [period, fetchTrend]);


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
            Welcome back! Here is a summary of your outlet&apos;s performance.
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 p-1 rounded-xl flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              disabled={chartLoading}
              className={`font-bold text-xs px-4 py-1.5 rounded-lg transition-all disabled:opacity-60 ${period === p.value
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

      {/* Alert Banner */}
      {data?.lowstock && data.lowstock.length > 0 && showBanner && (
        <div className="relative overflow-hidden rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/60 to-rose-50/50 p-4 shadow-sm transition-all duration-300 hover:shadow-md animate-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 border border-amber-200 text-amber-600 animate-pulse">
              <AlertTriangle className="h-5.5 w-5.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                Inventory Alerts
                {data.lowstock.filter(item => item.isOutOfStock).length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                    {data.lowstock.filter(item => item.isOutOfStock).length} Out of Stock
                  </span>
                )}
                {data.lowstock.filter(item => !item.isOutOfStock).length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                    {data.lowstock.filter(item => !item.isOutOfStock).length} Low Stock
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Some stock items have dropped below their minimum warning levels. This may prevent recipes from being prepared. Restock them to maintain normal operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pl-14 md:pl-0">
            <button
              onClick={() => {
                document.getElementById("alerts-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white rounded-lg transition-colors flex items-center gap-1 shadow-2sm cursor-pointer"
            >
              Details
            </button>
            <Link
              href={`/t/${tenantSlug}/manager/inventory`}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
            >
              Restock Items
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            onClick={() => setShowBanner(false)}
            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Dismiss alert"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


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

        <div className="rounded-xl border-l-4 border-l-blue-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Active Staff
            </p>

            <p className="text-3xl font-bold text-slate-800 mt-1">
              {isLoading
                ? <span className="text-xl text-slate-300 animate-pulse">Loading...</span>
                : data?.activeStaff ?? 0
              }
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
        </div>


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


      <div id="alerts-section" className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4 scroll-mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alerts & Warnings
          </div>
          {data?.lowstock && data.lowstock.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              Total {data.lowstock.length} warning{data.lowstock.length > 1 ? "s" : ""} active
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-slate-50 border border-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : !data?.lowstock || data.lowstock.length === 0 ? (
          <div>
            <p className="text-xs text-slate-400 text-center py-6">All systems normal. Stock levels are healthy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[...data.lowstock]
              .sort((a, b) => (a.isOutOfStock ? -1 : 1) - (b.isOutOfStock ? -1 : 1))
              .map((item) => (
                <div
                  key={item.id}
                  className={`
                    group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 hover:shadow-md
                    ${item.isOutOfStock
                      ? "border-rose-100 bg-rose-50/20 hover:bg-rose-50/40"
                      : "border-amber-100 bg-amber-50/15 hover:bg-amber-50/30"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-2 h-2 rounded-full shrink-0 animate-ping
                      ${item.isOutOfStock ? "bg-rose-500" : "bg-amber-500"}
                    `} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700 capitalize">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        Current: <span className={`font-bold ${item.isOutOfStock ? "text-rose-600" : "text-amber-600"}`}>{item.currentStock} {item.unit}</span>
                        {" • "}
                        Min Limit: <span className="font-semibold text-slate-600">{item.minStockLevel} {item.unit}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`
                      inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide
                      ${item.isOutOfStock
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                      }
                    `}>
                      {item.isOutOfStock ? "Out of Stock" : "Low Stock"}
                    </span>
                    <Link
                      href={`/t/${tenantSlug}/manager/inventory`}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ml-1 p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:scale-105 transform duration-150"
                      title={`Restock ${item.name}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

    </div>
  );
}