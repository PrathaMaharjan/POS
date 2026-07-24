// "use client";

// import { useState, useEffect } from "react";
// import {
//   Building2,
//   CreditCard,
//   Receipt,
//   Users,
//   TrendingUp,
//   Activity,
//   ArrowUpRight,
//   CheckCircle2,
//   AlertCircle,
//   ArrowRight,
//   Zap,
//   Percent,
//   Loader2,
// } from "lucide-react";
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   Cell,
// } from "recharts";


// const STATS_DATA = {
//   "30d": {
//     orgs: 156,
//     orgsGrowth: "+18%",
//     subs: 124,
//     subsGrowth: "+12%",
//     mrr: 724500,
//     mrrGrowth: "+14.2%",
//     users: 1842,
//     usersGrowth: "+22%",
//   },
//   "7d": {
//     orgs: 142,
//     orgsGrowth: "+4.3%",
//     subs: 118,
//     subsGrowth: "+2.1%",
//     mrr: 692000,
//     mrrGrowth: "+3.5%",
//     users: 1720,
//     usersGrowth: "+5.2%",
//   },
//   "12m": {
//     orgs: 210,
//     orgsGrowth: "+110%",
//     subs: 168,
//     subsGrowth: "+95%",
//     mrr: 980000,
//     mrrGrowth: "+85%",
//     users: 2940,
//     usersGrowth: "+140%",
//   }
// };

// const REGISTRATION_TREND_DATA = [
//   { month: "Jan", newSignups: 12, totalOrgs: 82 },
//   { month: "Feb", newSignups: 15, totalOrgs: 97 },
//   { month: "Mar", newSignups: 18, totalOrgs: 115 },
//   { month: "Apr", newSignups: 10, totalOrgs: 125 },
//   { month: "May", newSignups: 22, totalOrgs: 147 },
//   { month: "Jun", newSignups: 14, totalOrgs: 161 },
//   { month: "Jul", newSignups: 19, totalOrgs: 180 },
// ];

// const PLAN_DISTRIBUTION_DATA = [
//   { name: "Free Tier", value: 32, color: "#94a3b8" },
//   { name: "Basic Plan", value: 64, color: "#6366f1" },
//   { name: "Premium Plan", value: 48, color: "#10b981" },
//   { name: "Enterprise", value: 12, color: "#f59e0b" },
// ];

// const RECENT_ACTIVITIES = [
//   {
//     id: 1,
//     type: "signup",
//     title: "New Organization Signed Up",
//     desc: "Burger House & Crunchy Fried Chicken created a platform account.",
//     time: "2 hours ago",
//     badgeBg: "bg-emerald-50 text-emerald-700",
//   },
//   {
//     id: 2,
//     type: "upgrade",
//     title: "Subscription Upgraded",
//     desc: "Himalayan Java Coffee upgraded from Basic Plan to Premium Plan.",
//     time: "5 hours ago",
//     badgeBg: "bg-indigo-50 text-indigo-700",
//   },
//   {
//     id: 3,
//     type: "payment",
//     title: "Invoice Paid Successfully",
//     desc: "Momo Plaza processed transaction of Rs. 4,500 for June billing.",
//     time: "1 day ago",
//     badgeBg: "bg-amber-50 text-amber-600",
//   },
//   {
//     id: 4,
//     type: "alert",
//     title: "Threshold Alert Triggered",
//     desc: "Roadhouse Cafe branch 'Lakeside' exceeded active staff limit.",
//     time: "2 days ago",
//     badgeBg: "bg-red-50 text-red-600",
//   },
// ];

// const RECENT_INVOICES = [
//   { id: "INV-2026-004", org: "Burger House & CFC", date: "Jul 1, 2026", amount: 4500, status: "Paid", badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
//   { id: "INV-2026-003", org: "Himalayan Java Coffee", date: "Jun 30, 2026", amount: 8000, status: "Paid", badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
//   { id: "INV-2026-002", org: "Momo Plaza", date: "Jun 28, 2026", amount: 4500, status: "Pending", badgeBg: "bg-amber-50 text-amber-600 border-amber-100" },
//   { id: "INV-2026-001", org: "Roadhouse Cafe", date: "Jun 25, 2026", amount: 15000, status: "Overdue", badgeBg: "bg-red-50 text-red-600 border-red-100" },
// ];

// const HEALTH_SERVICES = [
//   { name: "Platform Database", status: "Healthy", latency: "14ms", iconColor: "bg-emerald-500" },
//   { name: "Auth & Auth0 Service", status: "Healthy", latency: "25ms", iconColor: "bg-emerald-500" },
//   { name: "Cloudinary CDN Gateway", status: "Healthy", latency: "180ms", iconColor: "bg-emerald-500" },
//   { name: "Resend Email Dispatcher", status: "Healthy", latency: "65ms", iconColor: "bg-emerald-500" },
// ];

// export default function SuperAdminOverviewPage() {
//   const [timeRange, setTimeRange] = useState<"7d" | "30d" | "12m">("30d");
//   const [mounted, setMounted] = useState(false);

//   const [platformStats, setPlatformStats] = useState<{
//     totalOrganizations: number;
//     platformUsers: number;
//   } | null>(null);

//   const [trendData, setTrendData] = useState<any[]>([]);
//   const [trendLabel, setTrendLabel] = useState<string>("");
//   const [loadingStats, setLoadingStats] = useState(true);
//   const [loadingTrend, setLoadingTrend] = useState(true);

//   useEffect(() => {
//     setMounted(true);

//     async function fetchStats() {
//       try {
//         const res = await fetch("/api/superadmin/dashboard/stats");
//         if (res.ok) {
//           const data = await res.json();
//           setPlatformStats(data);
//         }
//       } catch (err) {
//         console.error("Failed to fetch platform stats:", err);
//       } finally {
//         setLoadingStats(false);
//       }
//     }
//     fetchStats();
//   }, []);

//   useEffect(() => {
//     async function fetchTrend() {
//       setLoadingTrend(true);
//       try {
//         const period = timeRange === "7d" ? "7days" : timeRange === "30d" ? "30days" : "1year";
//         const res = await fetch(`/api/superadmin/dashboard/trend?period=${period}`);
//         if (res.ok) {
//           const data = await res.json();
//           setTrendData(data.data || []);
//           setTrendLabel(data.trendLabel || "");
//         }
//       } catch (err) {
//         console.error("Failed to fetch trend data:", err);
//       } finally {
//         setLoadingTrend(false);
//       }
//     }
//     fetchTrend();
//   }, [timeRange]);

//   const stats = STATS_DATA[timeRange];

//   const formattedTrendData = trendData.map((item) => ({
//     month: item.bucket,
//     newSignups: item.newOrgs,
//     totalOrgs: item.totalOrgs,
//   }));

//   return (
//     <div className="flex flex-col gap-8 p-4 md:p-0">
//       {/* Header Banner */}
//       <div className="rounded-2xl bg-emerald-600 px-6 py-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
//         </div>


//         <div className="flex bg-emerald-700/60 p-1 rounded-lg border border-emerald-500/30 self-start md:self-auto shadow-inner">
//           {(["7d", "30d", "12m"] as const).map((r) => (
//             <button
//               key={r}
//               onClick={() => setTimeRange(r)}
//               className={`px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${timeRange === r
//                 ? "bg-white text-emerald-800 shadow-sm"
//                 : "text-emerald-100 hover:text-white hover:bg-emerald-600/30"
//                 }`}
//             >
//               {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "12 Months"}
//             </button>
//           ))}
//         </div>
//       </div>


//       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

//         <div className="rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
//           <div>
//             <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Organizations</p>
//             {loadingStats ? (
//               <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mt-2" />
//             ) : (
//               <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">
//                 {platformStats ? platformStats.totalOrganizations : stats.orgs}
//               </p>
//             )}
//             <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Total registered tenants</p>
//           </div>
//           <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
//             <Building2 className="h-5 w-5 sm:h-6 w-6" />
//           </div>
//         </div>


//         <div className="rounded-xl border-l-4 border-l-indigo-500 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
//           <div>
//             <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Subscriptions</p>
//             <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{stats.subs}</p>
//             <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Paying customers</p>
//           </div>
//           <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
//             <CreditCard className="h-5 w-5 sm:h-6 w-6" />
//           </div>
//         </div>

//         {/* Monthly Recurring Revenue */}
//         <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
//           <div>
//             <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">MRR Estimate</p>
//             <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">Rs. {stats.mrr.toLocaleString()}</p>
//             <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Platform monthly billings</p>
//           </div>
//           <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
//             <Receipt className="h-5 w-5 sm:h-6 w-6" />
//           </div>
//         </div>


//         <div className="rounded-xl border-l-4 border-l-slate-400 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
//           <div>
//             <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Platform Users</p>
//             {loadingStats ? (
//               <Loader2 className="w-5 h-5 animate-spin text-slate-500 mt-2" />
//             ) : (
//               <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">
//                 {platformStats ? platformStats.platformUsers : stats.users}
//               </p>
//             )}
//             <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Active staff accounts</p>
//           </div>
//           <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 group-hover:scale-105 transition-transform">
//             <Users className="h-5 w-5 sm:h-6 w-6" />
//           </div>
//         </div>
//       </div>


//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//         <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tenant Registration Trend</h3>
//               <p className="text-xs text-slate-400 font-semibold mt-0.5">
//                 {trendLabel
//                   ? `${trendLabel} (${timeRange === "7d" ? "Last 7 Days" : timeRange === "30d" ? "Last 30 Days" : "Last 12 Months"})`
//                   : "Platform growth & signup velocity"}
//               </p>
//             </div>

//           </div>

//           <div className="h-72 w-full text-xs font-medium relative">
//             {loadingTrend && (
//               <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
//                 <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
//               </div>
//             )}
//             {mounted ? (
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart data={formattedTrendData.length > 0 ? formattedTrendData : REGISTRATION_TREND_DATA} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
//                   <defs>
//                     <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
//                       <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                   <XAxis dataKey="month" stroke="#94a3b8" axisLine={false} tickLine={false} />
//                   <YAxis
//                     stroke="#94a3b8"
//                     axisLine={false}
//                     tickLine={false}
//                     tickFormatter={(v) => `${v} orgs`}
//                   />
//                   <Tooltip
//                     contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
//                     labelStyle={{ fontWeight: "bold", color: "#334155" }}
//                   />
//                   <Area type="monotone" name="Total Organizations" dataKey="totalOrgs" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOrgs)" />
//                   <Area type="monotone" name="New Signups" dataKey="newSignups" stroke="#6366f1" strokeWidth={2} fillOpacity={0} />
//                 </AreaChart>
//               </ResponsiveContainer>
//             ) : (
//               <div className="flex h-full items-center justify-center text-slate-400">
//                 <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mr-2" /> Loading Chart...
//               </div>
//             )}
//           </div>
//         </div>


//         <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
//           <div>
//             <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Plan Distribution</h3>
//             <p className="text-xs text-slate-400 font-semibold mb-6">Subscriptions broken down by tier volume</p>

//             <div className="h-44 w-full text-xs font-semibold relative">
//               {mounted ? (
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={PLAN_DISTRIBUTION_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
//                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                     <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(v) => v.split(" ")[0]} />
//                     <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
//                     <Tooltip
//                       contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}
//                       formatter={(v) => [`${v} Active Tiers`, "Tiers count"]}
//                     />
//                     <Bar dataKey="value" radius={[6, 6, 0, 0]}>
//                       {PLAN_DISTRIBUTION_DATA.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <div className="flex h-full items-center justify-center text-slate-400" />
//               )}
//             </div>
//           </div>


//           <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
//             {PLAN_DISTRIBUTION_DATA.map((plan) => (
//               <div key={plan.name} className="flex items-center gap-2">
//                 <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: plan.color }} />
//                 <div>
//                   <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">{plan.name.split(" ")[0]}</p>
//                   <p className="text-xs font-bold text-slate-700 mt-1">{plan.value} orgs</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>


//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//         <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
//           <div className="flex items-center justify-between mb-5">
//             <div>
//               <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Billing Statements</h3>
//               <p className="text-xs text-slate-400 font-semibold mt-0.5">Most recent platform subscription invoices</p>
//             </div>
//             <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 group">
//               View All Invoices <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
//             </button>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full text-sm border-collapse text-left">
//               <thead>
//                 <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
//                   <th className="py-2.5 px-3">Invoice</th>
//                   <th className="py-2.5 px-3">Organization</th>
//                   <th className="py-2.5 px-3">Billing Date</th>
//                   <th className="py-2.5 px-3 text-right">Amount</th>
//                   <th className="py-2.5 px-3 text-right">Status</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
//                 {RECENT_INVOICES.map((inv) => (
//                   <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
//                     <td className="py-3.5 px-3 text-xs font-bold text-slate-500">{inv.id}</td>
//                     <td className="py-3.5 px-3 text-slate-900">{inv.org}</td>
//                     <td className="py-3.5 px-3 text-slate-400 font-semibold text-xs">{inv.date}</td>
//                     <td className="py-3.5 px-3 text-right text-slate-800 font-bold">Rs. {inv.amount.toLocaleString()}</td>
//                     <td className="py-3.5 px-3 text-right">
//                       <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${inv.badgeBg}`}>
//                         {inv.status}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <div className="flex flex-col gap-6">

//           <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
//             <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
//               <Zap className="w-4 h-4 text-amber-500" /> Platform Feed
//             </h3>
//             <div className="flex flex-col gap-4">
//               {RECENT_ACTIVITIES.map((act) => (
//                 <div key={act.id} className="flex gap-3">
//                   <div className={`w-1.5 h-10 rounded-full shrink-0 ${act.type === "signup" ? "bg-emerald-500" :
//                     act.type === "upgrade" ? "bg-indigo-500" :
//                       act.type === "payment" ? "bg-amber-500" : "bg-red-500"
//                     }`} />
//                   <div className="flex-1">
//                     <p className="text-xs font-bold text-slate-700 leading-tight">{act.title}</p>
//                     <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">{act.desc}</p>
//                     <span className="text-[10px] font-bold text-slate-300 block mt-1 uppercase tracking-wider">{act.time}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SuperAdminOverviewPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "12m">("30d");
  const [mounted, setMounted] = useState(false);

  const [platformStats, setPlatformStats] = useState<{
    totalOrganizations: number;
    platformUsers: number;
  } | null>(null);

  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendLabel, setTrendLabel] = useState<string>("");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);

  useEffect(() => {
    setMounted(true);

    async function fetchStats() {
      try {
        const res = await fetch("/api/superadmin/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setPlatformStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch platform stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchTrend() {
      setLoadingTrend(true);
      try {
        const period =
          timeRange === "7d"
            ? "7days"
            : timeRange === "30d"
            ? "30days"
            : "1year";
        const res = await fetch(
          `/api/superadmin/dashboard/trend?period=${period}`
        );
        if (res.ok) {
          const data = await res.json();
          setTrendData(data.data || []);
          setTrendLabel(data.trendLabel || "");
        }
      } catch (err) {
        console.error("Failed to fetch trend data:", err);
      } finally {
        setLoadingTrend(false);
      }
    }
    fetchTrend();
  }, [timeRange]);

  const formattedTrendData = trendData.map((item) => ({
    month: item.bucket,
    newSignups: item.newOrgs,
    totalOrgs: item.totalOrgs,
  }));

  return (
    <div className="flex flex-col gap-8 p-4 md:p-0">
      
      <div className="rounded-2xl bg-emerald-600 px-6 py-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        </div>

        <div className="flex bg-emerald-700/60 p-1 rounded-lg border border-emerald-500/30 self-start md:self-auto shadow-inner">
          {(["7d", "30d", "12m"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                timeRange === r
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-emerald-100 hover:text-white hover:bg-emerald-600/30"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "12 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Organizations
            </p>
            {loadingStats ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mt-2" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">
                {platformStats?.totalOrganizations ?? 0}
              </p>
            )}
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Total registered tenants
            </p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
            <Building2 className="h-5 w-5 sm:h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-slate-400 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Platform Users
            </p>
            {loadingStats ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-500 mt-2" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">
                {platformStats?.platformUsers ?? 0}
              </p>
            )}
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Active staff accounts
            </p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 group-hover:scale-105 transition-transform">
            <Users className="h-5 w-5 sm:h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Tenant Registration Trend
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {trendLabel
                ? `${trendLabel} (${
                    timeRange === "7d"
                      ? "Last 7 Days"
                      : timeRange === "30d"
                      ? "Last 30 Days"
                      : "Last 12 Months"
                  })`
                : "Platform growth & signup velocity"}
            </p>
          </div>
        </div>

        <div className="h-72 w-full text-xs font-medium relative">
          {loadingTrend && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          )}
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedTrendData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#10b981"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="#10b981"
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v} orgs`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#334155" }}
                />
                <Area
                  type="monotone"
                  name="Total Organizations"
                  dataKey="totalOrgs"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorOrgs)"
                />
                <Area
                  type="monotone"
                  name="New Signups"
                  dataKey="newSignups"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mr-2" />{" "}
              Loading Chart...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}