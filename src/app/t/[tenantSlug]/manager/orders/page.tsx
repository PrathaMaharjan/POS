"use client";

import React, { useState } from "react";
import {
  ShoppingBag, Clock, CheckCircle2, XCircle,
  TrendingUp, Utensils, Armchair, Search,
  ChevronDown, ChevronUp,
} from "lucide-react";

type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";

interface OrderItem {
  name: string;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: number;
  type: "DINE_IN" | "TAKEAWAY";
  items: OrderItem[];
  paymentMethod: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

const SEED_ORDERS: Order[] = [
  { id: "1", orderNumber: 1001, type: "DINE_IN",  items: [{ name: "Espresso", quantity: 2, subtotal: 300 }, { name: "Latte", quantity: 1, subtotal: 240 }], paymentMethod: "Cash",  status: "COMPLETED", total: 540,  createdAt: "2026-06-19T12:30:00" },
  { id: "2", orderNumber: 1002, type: "TAKEAWAY", items: [{ name: "Cappuccino", quantity: 1, subtotal: 220 }],                                                paymentMethod: "eSewa", status: "PENDING",   total: 220,  createdAt: "2026-06-19T12:45:00" },
  { id: "3", orderNumber: 1003, type: "DINE_IN",  items: [{ name: "Mocha", quantity: 2, subtotal: 560 }, { name: "Momo", quantity: 1, subtotal: 180 }],       paymentMethod: "Card",  status: "COMPLETED", total: 740,  createdAt: "2026-06-19T13:00:00" },
  { id: "4", orderNumber: 1004, type: "DINE_IN",  items: [{ name: "Flat White", quantity: 3, subtotal: 780 }],                                                paymentMethod: "Cash",  status: "CANCELLED", total: 780,  createdAt: "2026-06-19T13:15:00" },
  { id: "5", orderNumber: 1005, type: "TAKEAWAY", items: [{ name: "Green Tea", quantity: 2, subtotal: 240 }, { name: "Cake", quantity: 1, subtotal: 350 }],   paymentMethod: "eSewa", status: "COMPLETED", total: 590,  createdAt: "2026-06-19T13:30:00" },
  { id: "6", orderNumber: 1006, type: "DINE_IN",  items: [{ name: "Americano", quantity: 1, subtotal: 180 }],                                                 paymentMethod: "Cash",  status: "PENDING",   total: 180,  createdAt: "2026-06-19T13:45:00" },
];

const STATUS_STYLE: Record<OrderStatus, { bg: string; text: string; dot: string; label: string }> = {
  PENDING:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Pending"   },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Completed" },
  CANCELLED: { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500",     label: "Cancelled" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      o.orderNumber.toString().includes(q) ||
      o.type.toLowerCase().includes(q) ||
      o.paymentMethod.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const total     = orders.length;
  const completed = orders.filter(o => o.status === "COMPLETED").length;
  const pending   = orders.filter(o => o.status === "PENDING").length;
  const cancelled = orders.filter(o => o.status === "CANCELLED").length;
  const revenue   = orders.filter(o => o.status === "COMPLETED").reduce((s, o) => s + o.total, 0);

  function markComplete(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "COMPLETED" } : o));
  }

  function cancelOrder(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "CANCELLED" } : o));
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-emerald-100/80 mt-1">View and manage all outlet orders</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: total,     icon: <ShoppingBag className="h-5 w-5" />, iconBg: "bg-slate-50 text-slate-600"    },
          { label: "Completed",    value: completed, icon: <CheckCircle2 className="h-5 w-5" />, iconBg: "bg-emerald-50 text-emerald-600" },
          { label: "In Progress",  value: pending,   icon: <Clock className="h-5 w-5" />,        iconBg: "bg-amber-50 text-amber-600"    },
          { label: "Cancelled",    value: cancelled, icon: <XCircle className="h-5 w-5" />,      iconBg: "bg-red-50 text-red-500"        },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconBg}`}>{s.icon}</div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

     

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, type, method..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDING", "COMPLETED", "CANCELLED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                statusFilter === s
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Total</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-slate-400">
                    {orders.length === 0 ? "No orders recorded yet." : "No orders match your search."}
                  </td>
                </tr>
              ) : (
                paginated.map((order) => {
                  const s = STATUS_STYLE[order.status];
                  const isExpanded = expanded === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                        onClick={() => setExpanded(isExpanded ? null : order.id)}
                      >
                        <td className="py-3 px-4 font-bold text-emerald-600 font-mono text-xs">
                          #{order.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            {order.type === "DINE_IN"
                              ? <Armchair className="w-3.5 h-3.5 text-slate-400" />
                              : <Utensils className="w-3.5 h-3.5 text-slate-400" />}
                            {order.type === "DINE_IN" ? "Dine In" : "Takeaway"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-500">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">
                          Rs. {order.total.toLocaleString()}
                        </td>
                      
                      </tr>

                      {/* Expanded row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={8} className="px-6 py-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Order Items</p>
                            <div className="space-y-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                                  <div className="flex items-center gap-3">
                                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                      {item.quantity}
                                    </span>
                                    <span className="text-slate-700 font-medium">{item.name}</span>
                                  </div>
                                  <span className="text-slate-500 font-mono">Rs. {item.subtotal.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`e-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                          currentPage === p
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}