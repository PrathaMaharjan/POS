"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Building2, 
  CreditCard, 
  Calendar, 
  Download, 
  ArrowUpRight, 
  ChevronDown 
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const REVENUE_DATA = [
  { name: "Jan", revenue: 45000, signup: 12 },
  { name: "Feb", revenue: 52000, signup: 15 },
  { name: "Mar", revenue: 61000, signup: 18 },
  { name: "Apr", revenue: 58000, signup: 10 },
  { name: "May", revenue: 76000, signup: 22 },
  { name: "Jun", revenue: 84000, signup: 14 },
  { name: "Jul", revenue: 95000, signup: 19 },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("Last 7 Months");

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Reports</h1>
          <p className="text-slate-500 mt-1">Analyze system-wide metrics, signup trends, and platform revenue.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 7 Months</option>
              <option>Year to Date</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Platform Revenue</span>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800">Rs. 471,000.00</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +15.2% vs last period
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Organizations</span>
            <Building2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800">110</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +8.4% vs last period
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Paid Subscribers</span>
            <CreditCard className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800">82</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.1% vs last period
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Active Users</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800">1,452</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.7% vs last period
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Revenue Growth</h3>
            <p className="text-xs text-slate-500">Monthly subscription billing totals across all active tenants.</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs.${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Signup Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">New Signups</h3>
            <p className="text-xs text-slate-500">Monthly registration volume of new organizations.</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value) => [value, "New Signups"]}
                />
                <Bar dataKey="signup" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
