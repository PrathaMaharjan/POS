"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  Calendar,
  Store,
  ArrowUpRight,
  PieChart,
  BarChart3,
  UtensilsCrossed,
  Award,
  ChevronDown
} from "lucide-react";

// Mock Outlets
const OUTLETS = [
  { id: "all", name: "All Branches Combined" },
  { id: "1", name: "Kathmandu Main Branch" },
  { id: "2", name: "Lalitpur Hub" },
  { id: "3", name: "Pokhara Lakeside" }
];

// Simulated Data sets based on Outlet & Period
const DATA_STORE: Record<string, any> = {
  all: {
    "7days": {
      revenue: 1071500,
      orders: 3180,
      aov: 336.95,
      staffCount: 8,
      trend: [138000, 152000, 125000, 169000, 144000, 175000, 168500],
      trendLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      items: [
        { name: "Buff Momo", category: "Appetizer", sold: 1020, revenue: 153000 },
        { name: "Chicken Biryani", category: "Main Course", sold: 650, revenue: 227500 },
        { name: "Iced Latte", category: "Beverage", sold: 880, revenue: 220000 },
        { name: "Iced Matcha", category: "Beverage", sold: 560, revenue: 140000 }
      ],
      staff: [
        { name: "Prakash Thapa", orders: 1290, revenue: 435000, rank: 1 },
        { name: "Kang Roy", orders: 1010, revenue: 375000, rank: 2 },
        { name: "Aisha Karki", orders: 880, revenue: 261500, rank: 3 }
      ],
      payments: [
        { method: "QR Payment", percent: 45, amount: 482175, color: "bg-purple-500", text: "text-purple-600" },
        { method: "Cash", percent: 30, amount: 321450, color: "bg-[#0f6b4a]", text: "text-[#0f6b4a]" },
        { method: "Card", percent: 25, amount: 267875, color: "bg-blue-500", text: "text-blue-600" }
      ]
    },
    month: {
      revenue: 4380200,
      orders: 12950,
      aov: 338.24,
      staffCount: 8,
      trend: [850000, 980000, 1120000, 1430200],
      trendLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      items: [
        { name: "Buff Momo", category: "Appetizer", sold: 4150, revenue: 622500 },
        { name: "Chicken Biryani", category: "Main Course", sold: 2850, revenue: 997500 },
        { name: "Iced Latte", category: "Beverage", sold: 3450, revenue: 862500 },
        { name: "Iced Matcha", category: "Beverage", sold: 2180, revenue: 545000 }
      ],
      staff: [
        { name: "Prakash Thapa", orders: 5120, revenue: 1720000, rank: 1 },
        { name: "Kang Roy", orders: 4210, revenue: 1450200, rank: 2 },
        { name: "Aisha Karki", orders: 3620, revenue: 1210000, rank: 3 }
      ],
      payments: [
        { method: "QR Payment", percent: 48, amount: 2102496, color: "bg-purple-500", text: "text-purple-600" },
        { method: "Cash", percent: 27, amount: 1182654, color: "bg-[#0f6b4a]", text: "text-[#0f6b4a]" },
        { method: "Card", percent: 25, amount: 1095050, color: "bg-blue-500", text: "text-blue-600" }
      ]
    }
  },
  "1": {
    "7days": {
      revenue: 425800,
      orders: 1240,
      aov: 343.38,
      staffCount: 8,
      trend: [55000, 62000, 48000, 71000, 58000, 69000, 62800],
      trendLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      items: [
        { name: "Chicken Biryani", category: "Main Course", sold: 280, revenue: 98000 },
        { name: "Iced Latte", category: "Beverage", sold: 310, revenue: 77500 },
        { name: "Buff Momo", category: "Appetizer", sold: 420, revenue: 63000 },
        { name: "Iced Matcha", category: "Beverage", sold: 190, revenue: 47500 }
      ],
      staff: [
        { name: "Kang Roy", orders: 490, revenue: 165000, rank: 1 },
        { name: "Aisha Karki", orders: 410, revenue: 140000, rank: 2 },
        { name: "Prakash Thapa", orders: 340, revenue: 120800, rank: 3 }
      ],
      payments: [
        { method: "QR Payment", percent: 40, amount: 170320, color: "bg-purple-500", text: "text-purple-600" },
        { method: "Cash", percent: 35, amount: 149030, color: "bg-[#0f6b4a]", text: "text-[#0f6b4a]" },
        { method: "Card", percent: 25, amount: 106450, color: "bg-blue-500", text: "text-blue-600" }
      ]
    },
    month: {
      revenue: 1780500,
      orders: 5120,
      aov: 347.75,
      staffCount: 8,
      trend: [390000, 420000, 480000, 490500],
      trendLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      items: [
        { name: "Chicken Biryani", category: "Main Course", sold: 1150, revenue: 402500 },
        { name: "Iced Latte", category: "Beverage", sold: 1290, revenue: 322500 },
        { name: "Buff Momo", category: "Appetizer", sold: 1710, revenue: 256500 },
        { name: "Iced Matcha", category: "Beverage", sold: 790, revenue: 197500 }
      ],
      staff: [
        { name: "Kang Roy", orders: 2020, revenue: 690500, rank: 1 },
        { name: "Aisha Karki", orders: 1710, revenue: 590000, rank: 2 },
        { name: "Prakash Thapa", orders: 1390, revenue: 500000, rank: 3 }
      ],
      payments: [
        { method: "QR Payment", percent: 43, amount: 765615, color: "bg-purple-500", text: "text-purple-600" },
        { method: "Cash", percent: 33, amount: 587565, color: "bg-[#0f6b4a]", text: "text-[#0f6b4a]" },
        { method: "Card", percent: 24, amount: 427320, color: "bg-blue-500", text: "text-blue-600" }
      ]
    }
  },
  "2": {
    "7days": {
      revenue: 289500,
      orders: 890,
      aov: 325.28,
      staffCount: 5,
      trend: [38000, 41000, 35000, 45000, 39000, 48000, 43500],
      trendLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      items: [
        { name: "Chicken Biryani", category: "Main Course", sold: 190, revenue: 66500 },
        { name: "Iced Latte", category: "Beverage", sold: 180, revenue: 45000 },
        { name: "Buff Momo", category: "Appetizer", sold: 290, revenue: 43500 },
        { name: "Iced Matcha", category: "Beverage", sold: 150, revenue: 37500 }
      ],
      staff: [
        { name: "Aisha Karki", orders: 510, revenue: 165000, rank: 1 },
        { name: "Prakash Thapa", orders: 380, revenue: 124500, rank: 2 }
      ],
      payments: [
        { method: "QR Payment", percent: 50, amount: 144750, color: "bg-purple-500", text: "text-purple-600" },
        { method: "Card", percent: 30, amount: 86850, color: "bg-blue-500", text: "text-blue-600" },
        { method: "Cash", percent: 20, amount: 57900, color: "bg-[#0f6b4a]", text: "text-[#0f6b4a]" }
      ]
    },
    month: {
      revenue: 1195000,
      orders: 3650,
      aov: 327.4,
      staffCount: 5,
      trend: [260000, 290000, 310000, 335000],
      trendLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      items: [
        { name: "Chicken Biryani", category: "Main Course", sold: 780, revenue: 273000 },
        { name: "Iced Latte", category: "Beverage", sold: 760, revenue: 190000 },
        { name: "Buff Momo", category: "Appetizer", sold: 1210, revenue: 181500 },
        { name: "Iced Matcha", category: "Beverage", sold: 610, revenue: 152500 }
      ],
      staff: [
        { name: "Aisha Karki", orders: 2050, revenue: 685000, rank: 1 },
        { name: "Prakash Thapa", orders: 1600, revenue: 510000, rank: 2 }
      ],
      payments: [
        { method: "QR Payment", percent: 52, amount: 621400, color: "bg-purple-500", text: "text-purple-600" },
        { method: "Card", percent: 28, amount: 334600, color: "bg-blue-500", text: "text-blue-600" },
        { method: "Cash", percent: 20, amount: 239000, color: "bg-[#0f6b4a]", text: "text-[#0f6b4a]" }
      ]
    }
  },
  "3": {
    "7days": {
      revenue: 356200,
      orders: 1050,
      aov: 339.23,
      staffCount: 6,
      trend: [45000, 49000, 42000, 53000, 47000, 58000, 62200],
      trendLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      items: [
        { name: "Iced Latte", category: "Beverage", sold: 390, revenue: 97500 },
        { name: "Iced Matcha", category: "Beverage", sold: 220, revenue: 55000 },
        { name: "Buff Momo", category: "Appetizer", sold: 310, revenue: 46500 },
        { name: "Chicken Biryani", category: "Main Course", sold: 180, revenue: 63000 }
      ],
      staff: [
        { name: "Prakash Thapa", orders: 630, revenue: 216200, rank: 1 },
        { name: "Kang Roy", orders: 420, revenue: 140000, rank: 2 }
      ],
      payments: [
        { method: "QR Payment", percent: 40, amount: 142480, color: "bg-purple-500", text: "text-purple-600" },
        { method: "Card", percent: 35, amount: 124670, color: "bg-blue-500", text: "text-blue-600" },
        { method: "Cash", percent: 25, amount: 89050, color: "bg-[#0f6b4a]", text: "text-[#0f6b4a]" }
      ]
    },
    month: {
      revenue: 1404700,
      orders: 4180,
      aov: 336.05,
      staffCount: 6,
      trend: [310000, 340000, 360000, 394700],
      trendLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      items: [
        { name: "Iced Latte", category: "Beverage", sold: 1540, revenue: 385000 },
        { name: "Iced Matcha", category: "Beverage", sold: 880, revenue: 220000 },
        { name: "Buff Momo", category: "Appetizer", sold: 1230, revenue: 184500 },
        { name: "Chicken Biryani", category: "Main Course", sold: 580, revenue: 203000 }
      ],
      staff: [
        { name: "Prakash Thapa", orders: 2480, revenue: 840000, rank: 1 },
        { name: "Kang Roy", orders: 1700, revenue: 564700, rank: 2 }
      ],
      payments: [
        { method: "QR Payment", percent: 41, amount: 575927, color: "bg-purple-500", text: "text-purple-600" },
        { method: "Card", percent: 34, amount: 477598, color: "bg-blue-500", text: "text-blue-600" },
        { method: "Cash", percent: 25, amount: 351175, color: "bg-[#0f6b4a]", text: "text-[#0f6b4a]" }
      ]
    }
  }
};

export default function ReportsPage() {
  const [selectedOutlet, setSelectedOutlet] = useState("all");
  const [timePeriod, setTimePeriod] = useState<"7days" | "month">("7days");

  const reportData = useMemo(() => {
    return DATA_STORE[selectedOutlet]?.[timePeriod] || DATA_STORE.all["7days"];
  }, [selectedOutlet, timePeriod]);

  // SVG Chart Dimensions & Computations
  const chartHeight = 180;
  const chartWidth = 500;
  const points = useMemo(() => {
    const trend: number[] = reportData.trend;
    const maxVal = Math.max(...trend) * 1.15;
    const minVal = Math.min(...trend) * 0.85;
    const range = maxVal - minVal;

    return trend.map((val, index) => {
      const x = (index / (trend.length - 1)) * (chartWidth - 40) + 20;
      const y = chartHeight - ((val - minVal) / range) * (chartHeight - 40) - 20;
      return { x, y, value: val };
    });
  }, [reportData]);

  // Generate SVG Path
  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");
  }, [points]);

  // Generate Area SVG Path (closed loop for gradient fill)
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const start = points[0];
    const end = points[points.length - 1];
    return `M ${start.x} ${chartHeight} L ${start.x} ${start.y} ${linePath.substring(linePath.indexOf("L"))} L ${end.x} ${chartHeight} Z`;
  }, [points, linePath]);

  return (
    <div className="flex flex-col gap-6 md:gap-8 p-4 sm:p-0">

      {/* Header Widget */}
      <div className="rounded-xl bg-emerald-600 px-4 py-4 md:px-6 md:py-5 text-white shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organization Reports</h1>
          <p className="text-xs md:text-sm text-emerald-100 mt-1">
            Aggregate and analyze business performance analytics switchable per outlet branch.
          </p>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Outlet Selection */}
          <div className="relative">
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="w-full sm:w-56 appearance-none rounded-lg bg-emerald-700/80 px-4 py-2.5 pr-10 text-sm font-semibold text-white border border-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
            >
              {OUTLETS.map((o) => (
                <option key={o.id} value={o.id} className="text-slate-800 bg-white">
                  {o.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-200" />
          </div>

          {/* Time range selection */}
          <div className="relative">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as "7days" | "month")}
              className="w-full sm:w-40 appearance-none rounded-lg bg-emerald-700/80 px-4 py-2.5 pr-10 text-sm font-semibold text-white border border-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
            >
              <option value="7days" className="text-slate-800 bg-white">Last 7 Days</option>
              <option value="month" className="text-slate-800 bg-white">This Month</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-200" />
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Net Revenue", value: `Rs. ${reportData.revenue.toLocaleString()}`, border: "border-l-[#18a172]", iconBg: "bg-[#f0fdf4] text-[#0f6b4a]", icon: <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Total Orders", value: reportData.orders.toLocaleString(), border: "border-l-indigo-500", iconBg: "bg-indigo-50 text-indigo-600", icon: <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Average Order Value", value: `Rs. ${reportData.aov.toFixed(2)}`, border: "border-l-amber-500", iconBg: "bg-amber-50 text-amber-600", icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Active Staff", value: reportData.staffCount, border: "border-l-slate-400", iconBg: "bg-slate-50 text-slate-600", icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" /> }
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border-l-4 ${s.border} border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between transition-transform duration-200 hover:-translate-y-0.5`}
          >
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl sm:text-2xl font-semibold text-slate-800 mt-1 break-all">{s.value}</p>
            </div>
            <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Sales Trend Graph + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sales Trend (Large SVG Chart) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Sales Progression Trend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Track revenue performance over the current period</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +12.4% vs prev
            </span>
          </div>

          {/* SVG Canvas Chart */}
          <div className="relative w-full overflow-hidden flex items-center justify-center my-4 h-[200px]">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full text-emerald-500 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1={chartHeight - 20} x2={chartWidth - 20} y2={chartHeight - 20} stroke="#f1f5f9" strokeWidth="2" />
              <line x1="20" y1={chartHeight / 2} x2={chartWidth - 20} y2={chartHeight / 2} stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="20" y1="20" x2={chartWidth - 20} y2="20" stroke="#f1f5f9" strokeDasharray="4 4" />

              {/* Path Area under Curve */}
              <path d={areaPath} fill="url(#chartGrad)" />

              {/* Curve Stroke */}
              <path d={linePath} fill="none" stroke="#0f6b4a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Point Circles & labels */}
              {points.map((p, idx) => (
                <g key={idx} className="group/dot">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    className="fill-white stroke-[#0f6b4a] stroke-[3px] cursor-pointer transition-all duration-150 hover:r-6"
                  />
                  {/* Subtle hover bubble overlay */}
                  <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 pointer-events-none">
                    <rect
                      x={p.x - 35}
                      y={p.y - 30}
                      width="70"
                      height="20"
                      rx="4"
                      className="fill-slate-800 shadow"
                    />
                    <text
                      x={p.x}
                      y={p.y - 16}
                      textAnchor="middle"
                      className="fill-white text-[9px] font-mono font-bold"
                    >
                      Rs. {Math.round(p.value).toLocaleString()}
                    </text>
                  </g>
                </g>
              ))}
            </svg>
          </div>

          {/* Graph X Axis Labels */}
          <div className="flex justify-between items-center px-4 pt-2 text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider">
            {reportData.trendLabels.map((lbl: string, i: number) => (
              <span key={i}>{lbl}</span>
            ))}
          </div>
        </div>

        {/* Payment Breakdown Widget */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Payment Gateway Share
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Distribution across transaction methods</p>
          </div>

          {/* Progress Bars Stack */}
          <div className="flex-1 flex flex-col justify-center gap-6 py-4">
            {reportData.payments.map((p: any) => (
              <div key={p.method} className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <span className="text-slate-600">{p.method}</span>
                  <span className={`${p.text} font-mono font-bold`}>
                    {p.percent}% <span className="text-slate-400 font-normal">({Math.round(p.percent * reportData.orders / 100)} orders)</span>
                  </span>
                </div>
                {/* Visual bar */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full transition-all duration-500`} style={{ width: `${p.percent}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 text-right font-mono">
                  Rs. {p.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Total Amount box */}
          <div className="border-t border-slate-100 pt-4 mt-2 text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Settled Amount</span>
            <p className="text-xl font-bold text-[#0f6b4a] mt-0.5">Rs. {reportData.revenue.toLocaleString()}</p>
          </div>
        </div>

      </div>

      {/* Grid: Popular Menu Items & Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Popular Menu Items */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                Popular Menu Items
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Best performing items by quantity sold</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Qty Sold</th>
                  <th className="py-2.5 px-3 text-right">Gross Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.items.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-500 rounded px-2 py-0.5">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">{item.sold}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#0f6b4a]">
                      Rs. {item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Sales Performance */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Staff Sales Leaderboard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Staff rankings based on processed sales volumes</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3 text-center w-12">Rank</th>
                  <th className="py-2.5 px-3">Sales Agent</th>
                  <th className="py-2.5 px-3 text-center">Orders</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.staff.map((st: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : idx === 1
                            ? "bg-slate-100 text-slate-800 border border-slate-200"
                            : "bg-orange-100 text-orange-800 border border-orange-200"
                        }`}>
                        {st.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{st.name}</td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">{st.orders}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#0f6b4a]">
                      Rs. {st.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
