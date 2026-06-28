"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  Store,
  PieChart,
  UtensilsCrossed,
  Award,
  ChevronDown,
  GitCompare,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";



interface OutletOption {
  id: string;
  name: string;
}

interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  activeStaff: number;
}

interface SalesTrendItem {
  label: string;
  total: number;
  count: number;
}

interface PaymentShareDetails {
  total: number;
  count: number;
  percentage: number;
}

interface PaymentShare {
  netSettledAmount: number;
  breakdown: {
    cash?: PaymentShareDetails;
    card?: PaymentShareDetails;
    qr?: PaymentShareDetails;
  };
}

interface PopularMenuItem {
  name: string;
  categoryName: string;
  totalSold: number;
  grossSales: number;
}

interface StaffLeaderboardItem {
  rank: number;
  staffName: string;
  totalOrders: number;
  totalVolume: number;
}

interface OrgReportData {
  period: string;
  outletId: string | null;
  summary: DashboardSummary;
  salesTrend: SalesTrendItem[];
  paymentShare: PaymentShare;
  popularItems: PopularMenuItem[];
  leaderboard: StaffLeaderboardItem[];
}

interface UIPaymentItem {
  method: string;
  percent: number;
  amount: number;
  color: string;
  text: string;
  orders: number;
  barColor: string;
}

interface UIPopularMenuItem {
  name: string;
  category: string;
  sold: number;
  revenue: number;
}

interface UIStaffItem {
  name: string;
  orders: number;
  revenue: number;
  rank: number;
}

interface UIReportData {
  revenue: number;
  orders: number;
  aov: number;
  staffCount: number;
  trendData: { label: string; revenue: number; orders: number }[];
  items: UIPopularMenuItem[];
  staff: UIStaffItem[];
  payments: UIPaymentItem[];
}

interface BranchComparisonItem {
  name: string;
  revenue: number;
  orders: number;
  fill: string;
}


const BRANCH_COLORS = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
  "#f97316",
];



function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700">
      <p className="font-bold mb-1 text-slate-300">{label}</p>
      <p className="text-emerald-400 font-mono font-bold">
        Rs. {Number(payload[0]?.value ?? 0).toLocaleString()}
      </p>
      {payload[1] && (
        <p className="text-blue-300 font-mono">{payload[1].value} orders</p>
      )}
    </div>
  );
}

function PaymentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700">
      <p className="font-bold mb-1 text-slate-300">{label}</p>
      <p className="text-emerald-400 font-mono">
        Rs. {Number(payload[0]?.value ?? 0).toLocaleString()}
      </p>
    </div>
  );
}

function BranchTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700">
      <p className="font-bold mb-1" style={{ color: d.fill }}>{d.name}</p>
      <p className="text-emerald-400 font-mono">Rs. {Number(d.revenue).toLocaleString()}</p>
      <p className="text-slate-300 font-mono">{d.orders} orders</p>
    </div>
  );
}



function PaymentPanel({ payments, revenue }: { payments: UIPaymentItem[]; revenue: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-600" />
          Payment Methods
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Revenue split by payment type</p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5 py-2">
        {payments.map(p => (
          <div key={p.method} className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                <span className="text-slate-600">{p.method}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-normal">{p.orders} orders</span>
                <span className={`font-bold font-mono ${p.text}`}>{p.percent}%</span>
              </div>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${p.percent}%`,
                  backgroundColor: p.barColor,
                }}
              />
            </div>
            <div className="text-[10px] text-slate-400 text-right font-mono">
              Rs. {p.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-3 mt-3 text-center">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Settled</span>
        <p className="text-lg font-bold text-emerald-700 mt-0.5">
          Rs. {revenue.toLocaleString()}
        </p>
      </div>
    </div>
  );
}



export default function ReportsPage() {
  const [outlets, setOutlets] = useState<OutletOption[]>([
    { id: "all", name: "All Branches Combined" },
  ]);
  const [selectedOutlet, setSelectedOutlet] = useState("all");
  const [timePeriod, setTimePeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrgReportData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [branchData, setBranchData] = useState<BranchComparisonItem[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);


  useEffect(() => {
    async function fetchOutlets() {
      try {
        const res = await api.get("/outlets");
        if (res.data?.outlets) {
          setOutlets([
            { id: "all", name: "All Branches Combined" },
            ...res.data.outlets.map((o: { id: string; name: string }) => ({
              id: o.id,
              name: o.name,
            })),
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch outlets:", err);
      }
    }
    fetchOutlets();
  }, []);


  useEffect(() => {
    async function fetchReportData() {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string> = { period: timePeriod };
        if (selectedOutlet !== "all") params.outletId = selectedOutlet;
        const res = await api.get("/org/dashboardData", { params });
        setData(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.error ?? "Failed to load report data");
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, [selectedOutlet, timePeriod, refreshTrigger]);


  useEffect(() => {
    if (selectedOutlet !== "all") {
      setBranchData([]);
      return;
    }
    const realOutlets = outlets.filter(o => o.id !== "all");
    if (realOutlets.length === 0) return;

    async function fetchBranchComparison() {
      setBranchLoading(true);
      try {
        const results = await Promise.allSettled(
          realOutlets.map(outlet =>
            api.get("/org/dashboardData", {
              params: { period: timePeriod, outletId: outlet.id },
            }).then(res => ({
              name: outlet.name,
              summary: res.data?.summary ?? {},
            }))
          )
        );
        setBranchData(
          results
            .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
            .map((r, idx) => ({
              name: r.value.name.length > 12 ? r.value.name.slice(0, 12) + "…" : r.value.name,
              revenue: Number(r.value.summary.totalRevenue ?? 0),
              orders:  Number(r.value.summary.totalOrders  ?? 0),
              fill:    BRANCH_COLORS[idx % BRANCH_COLORS.length],
            }))
        );
      } catch (err) {
        console.error("Failed to fetch branch comparison:", err);
      } finally {
        setBranchLoading(false);
      }
    }
    fetchBranchComparison();
  }, [selectedOutlet, outlets, timePeriod]);

  const reportData = useMemo<UIReportData | null>(() => {
    if (!data) return null;

    const summary      = data.summary      ?? { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, activeStaff: 0 };
    const salesTrend   = data.salesTrend   ?? [];
    const paymentShare = data.paymentShare ?? { netSettledAmount: 0, breakdown: {} };
    const popularItems = data.popularItems ?? [];
    const leaderboard  = data.leaderboard  ?? [];

    const trendData = salesTrend.map(t => {
      const isWeekday = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].includes(t.label);
      return {
        label:   isWeekday ? t.label.slice(0, 3) : t.label,
        revenue: t.total ?? 0,
        orders:  t.count ?? 0,
      };
    });

    const items = popularItems.map(item => ({
      name:     item.name,
      category: item.categoryName ?? "Uncategorized",
      sold:     item.totalSold    ?? 0,
      revenue:  item.grossSales   ?? 0,
    }));

    const staff = leaderboard.map(st => ({
      name:    st.staffName,
      orders:  st.totalOrders ?? 0,
      revenue: st.totalVolume ?? 0,
      rank:    st.rank,
    }));

    const bd = paymentShare.breakdown ?? {};
    const payments: UIPaymentItem[] = [
      { method: "Cash", percent: bd.cash?.percentage ?? 0, amount: bd.cash?.total ?? 0, color: "bg-emerald-500", text: "text-emerald-600", orders: bd.cash?.count ?? 0, barColor: "#10b981" },
      { method: "Card", percent: bd.card?.percentage ?? 0, amount: bd.card?.total ?? 0, color: "bg-blue-500",    text: "text-blue-600",    orders: bd.card?.count ?? 0, barColor: "#3b82f6" },
      { method: "QR",   percent: bd.qr?.percentage   ?? 0, amount: bd.qr?.total   ?? 0, color: "bg-purple-500", text: "text-purple-600", orders: bd.qr?.count   ?? 0, barColor: "#a855f7" },
    ];

    return {
      revenue:    summary.totalRevenue  ?? 0,
      orders:     summary.totalOrders   ?? 0,
      aov:        summary.avgOrderValue ?? 0,
      staffCount: summary.activeStaff   ?? 0,
      trendData,
      items,
      staff,
      payments,
    };
  }, [data]);

  const maxRevenue = Math.max(...branchData.map(b => b.revenue), 1);
  const radialData = branchData.map(b => ({
    ...b,
    value: Math.round((b.revenue / maxRevenue) * 100),
  }));


  if (loading) {
    return (
      <div className="flex flex-col gap-6 md:gap-8 animate-pulse">
        <div className="h-24 rounded-xl bg-slate-200" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-slate-200" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-xl bg-slate-200" />
          <div className="h-72 rounded-xl bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl bg-slate-200" />
          <div className="h-64 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center shadow-sm">
        <h3 className="text-sm font-semibold text-red-800 mb-1">Failed to load report data</h3>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button
          onClick={() => setRefreshTrigger(p => p + 1)}
          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }


  if (!reportData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Store className="h-8 w-8 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-700">No sales data found</h3>
        <p className="text-xs text-slate-400 mt-1">No transactions recorded for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-4 py-4 md:px-6 md:py-5 text-white shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organization Reports</h1>
         
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select
              value={selectedOutlet}
              onChange={e => setSelectedOutlet(e.target.value)}
              className="w-full sm:w-56 appearance-none rounded-lg bg-emerald-700/80 px-4 py-2.5 pr-10 text-sm font-semibold text-white border border-emerald-500/30 focus:outline-none cursor-pointer"
            >
              {outlets.map(o => (
                <option key={o.id} value={o.id} className="text-slate-800 bg-white">{o.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-200" />
          </div>
          <div className="relative">
            <select
              value={timePeriod}
              onChange={e => setTimePeriod(e.target.value as "7d" | "30d" | "90d")}
              className="w-full sm:w-40 appearance-none rounded-lg bg-emerald-700/80 px-4 py-2.5 pr-10 text-sm font-semibold text-white border border-emerald-500/30 focus:outline-none cursor-pointer"
            >
              <option value="7d"  className="text-slate-800 bg-white">Last 7 Days</option>
              <option value="30d" className="text-slate-800 bg-white">Last 30 Days</option>
              <option value="90d" className="text-slate-800 bg-white">Last 90 Days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-200" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Net Revenue",     value: `Rs. ${reportData.revenue.toLocaleString()}`, border: "border-l-emerald-500", iconBg: "bg-emerald-50 text-emerald-600", icon: <DollarSign className="h-5 w-5" /> },
          { label: "Total Orders",    value: reportData.orders.toLocaleString(),            border: "border-l-indigo-500",  iconBg: "bg-indigo-50 text-indigo-600",   icon: <ShoppingBag className="h-5 w-5" /> },
          { label: "Avg Order Value", value: `Rs. ${reportData.aov.toFixed(2)}`,            border: "border-l-amber-500",   iconBg: "bg-amber-50 text-amber-600",     icon: <TrendingUp className="h-5 w-5" /> },
          { label: "Active Staff",    value: reportData.staffCount,                          border: "border-l-slate-400",   iconBg: "bg-slate-50 text-slate-600",     icon: <Users className="h-5 w-5" /> },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border-l-4 ${s.border} border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between`}>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>


      {selectedOutlet === "all" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-emerald-600" />
                  Branch Revenue Comparison
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Revenue performance across all outlet branches
                </p>
              </div>
              {branchLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>

            {branchLoading ? (
              <div className="h-64 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Fetching branch data...</span>
              </div>
            ) : branchData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                No branch data available
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height={280}>
                    <RadialBarChart
                      cx="50%" cy="50%"
                      innerRadius="20%" outerRadius="90%"
                      data={radialData}
                      startAngle={180} endAngle={-180}
                    >
                      <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#f1f5f9" }} label={false} />
                      <Tooltip content={<BranchTooltip />} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Revenue Breakdown
                  </p>
                  {branchData.map((branch, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branch.fill }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700 truncate">{branch.name}</span>
                          <span className="text-xs font-bold font-mono text-slate-800 ml-2 shrink-0">
                            Rs. {branch.revenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.round((branch.revenue / maxRevenue) * 100)}%`,
                              backgroundColor: branch.fill,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{branch.orders} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <PaymentPanel payments={reportData.payments} revenue={reportData.revenue} />
        </div>
      )}

      {selectedOutlet !== "all" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sales Trend */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Sales Trend</h2>
                <p className="text-xs text-slate-400 mt-0.5">Revenue over the selected period</p>
              </div>
            </div>
            {reportData.trendData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                No trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={reportData.trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `Rs.${(v / 1000).toFixed(0)}k`} width={52} />
                  <Tooltip content={<TrendTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0f6b4a" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 3, fill: "#0f6b4a", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="orders"  name="Orders"  stroke="#6366f1" strokeWidth={1.5} fill="url(#ordersGrad)" dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment Methods */}
          <PaymentPanel payments={reportData.payments} revenue={reportData.revenue} />
        </div>
      )}

     
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Popular Menu Items */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
              Popular Menu Items
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Best performing items by quantity sold</p>
          </div>
          {reportData.items.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 italic">No items data available</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-left">
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-500 rounded px-2 py-0.5">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">{item.sold}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      Rs. {item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Staff Leaderboard */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Staff Sales Leaderboard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Rankings based on processed sales volume</p>
          </div>
          {reportData.staff.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 italic">No staff data available</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-left">
                  <th className="py-2.5 px-3 text-center w-12">Rank</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3 text-center">Orders</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.staff.map((st, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        idx === 0 ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : idx === 1 ? "bg-slate-100 text-slate-600 border border-slate-200"
                        : "bg-orange-100 text-orange-700 border border-orange-200"
                      }`}>
                        {st.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{st.name}</td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">{st.orders}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      Rs. {st.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}