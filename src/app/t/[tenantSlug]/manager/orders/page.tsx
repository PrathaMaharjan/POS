"use client";

import React, { useState, useMemo, useEffect } from "react";
import api from "@/lib/api";
import {
  ShoppingBag, Clock, CheckCircle2, XCircle,
  TrendingUp, Utensils, Armchair, Search,
  Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";

type OrderStatus = "pending" | "completed" | "cancelled";

interface OrderItem {
  name: string;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: number;
  type: "dine_in" | "takeaway";
  tableName: string | null;
  customerName: string | null;
  items: OrderItem[];
  paymentMethod: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}

const STATUS_STYLE: Record<OrderStatus, { bg: string; text: string; dot: string; label: string }> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-500",  label: "Pending"   },
  completed: { bg: "bg-[#f0fdf4]",  text: "text-[#0f6b4a]", dot: "bg-[#18a172]",  label: "Completed" },
  cancelled: { bg: "bg-red-50",     text: "text-red-600",    dot: "bg-red-500",    label: "Cancelled" },
};

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.get("/orders");
        const raw = res.data.orders ?? [];

        const mapped: Order[] = raw.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          type: o.orderType,
          tableName: o.table?.tableNumber ?? o.table?.name ?? null,
          customerName: o.customerName ?? null,
          status: o.status as OrderStatus,
          paymentMethod: o.payments?.[0]?.method ?? "Unpaid",
          subtotal: parseFloat(o.subtotal ?? "0"),
          tax: parseFloat(o.tax ?? "0"),
          total: parseFloat(o.total ?? "0"),
          createdAt: o.createdAt,
          items: (o.items ?? []).map((item: any) => ({
            name: item.product?.name ?? "Unknown",
            quantity: item.quantity,
            subtotal: parseFloat(item.subtotal ?? "0"),
          })),
        }));

        setOrders(mapped);
      } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const total     = orders.length;
  const completed = orders.filter(o => o.status === "completed").length;
  const pending   = orders.filter(o => o.status === "pending").length;
  const cancelled = orders.filter(o => o.status === "cancelled").length;
  const revenue   = orders
    .filter(o => o.status === "completed")
    .reduce((s, o) => s + o.total, 0);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch =
        o.orderNumber.toString().includes(q) ||
        o.type.toLowerCase().includes(q) ||
        o.paymentMethod.toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        o.items.some(i => i.name.toLowerCase().includes(q));
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-0">

      {/* Header */}
      <div className="rounded-xl bg-[#0f6b4a] px-6 py-5 text-white shadow-sm">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Orders</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Orders", value: total,                         border: "border-l-slate-400",  iconBg: "bg-slate-50 text-slate-600",    icon: <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Revenue",      value: `Rs. ${revenue.toLocaleString()}`, border: "border-l-[#18a172]",  iconBg: "bg-[#f0fdf4] text-[#0f6b4a]",   icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Completed",    value: completed,                         border: "border-l-[#18a172]",  iconBg: "bg-[#f0fdf4] text-[#0f6b4a]",   icon: <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "In Progress",  value: pending,                           border: "border-l-amber-500",  iconBg: "bg-amber-50 text-amber-600",    icon: <Clock className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Cancelled",    value: cancelled,                         border: "border-l-red-500",    iconBg: "bg-red-50 text-red-500",        icon: <XCircle className="h-5 w-5 sm:h-6 sm:w-6" /> },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border-l-4 ${s.border} border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between`}
          >
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{s.value}</p>
            </div>
            <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, type, item, customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#18a172] focus:outline-none focus:ring-1 focus:ring-[#18a172]"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
          {(["ALL", "pending", "completed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? "bg-[#0f6b4a] text-white border-[#0f6b4a]"
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table Box */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto whitespace-nowrap lg:whitespace-normal">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Order No.</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-3 text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-red-500">{error}</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
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
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpanded(isExpanded ? null : order.id)}
                      >
                        <td className="py-3.5 px-4 font-bold text-[#0f6b4a] font-mono text-xs">
                          #{order.orderNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            {order.type === "dine_in"
                              ? <Armchair className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              : <Utensils className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <span>
                              {order.type === "dine_in"
                                ? `Dine In${order.tableName ? ` · ${order.tableName}` : ""}`
                                : `Takeaway${order.customerName ? ` · ${order.customerName}` : ""}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-500">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          Rs. {order.total.toLocaleString()}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={7} className="px-4 py-4 lg:px-6">
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Order Items</p>
                                <div className="space-y-1">
                                  {order.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                                      <div className="flex items-center gap-3 pr-4 min-w-0">
                                        <span className="w-5 h-5 shrink-0 rounded-full bg-[#dcfce7] flex items-center justify-center text-[10px] font-bold text-[#0f6b4a]">
                                          {item.quantity}
                                        </span>
                                        <span className="text-slate-700 font-medium truncate">{item.name}</span>
                                      </div>
                                      <span className="text-slate-500 font-mono shrink-0">Rs. {item.subtotal.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Summary Box */}
                              <div className="w-full md:w-56 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Summary</p>
                                <div className="flex flex-col gap-1.5 text-xs">
                                  <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span className="font-mono">Rs. {order.subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-500">
                                    <span>Tax (8%)</span>
                                    <span className="font-mono">Rs. {order.tax.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1.5 mt-1">
                                    <span>Total</span>
                                    <span className="text-[#0f6b4a] font-mono">Rs. {order.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
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

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <div className="text-sm text-slate-500 order-2 sm:order-1" />
          <div className="flex items-center gap-6 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Next Page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}