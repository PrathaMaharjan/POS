"use client";

import { useState, useEffect } from "react";
import {
  CreditCard, Banknote, Smartphone, TrendingUp,
  CheckCircle2, Clock, Search, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import api from "@/lib/api";

interface Payment {
  id: string;
  orderId: string;
  tableNumber: string | null;
  orderType: string;
  orderNumber: number;
  method: string;
  amount: number;
  createdAt: string;
  createdAtNepal: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const METHOD_LABEL: Record<string, string> = {
  cash:  "Cash",
  card:  "Card",
  qr:    "QR",
 
};

const METHOD_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  cash:  { bg: "bg-[#f0fdf4]", text: "text-[#0f6b4a]", icon: <Banknote className="w-3.5 h-3.5" />  },
  card:  { bg: "bg-blue-50",   text: "text-blue-700",   icon: <CreditCard className="w-3.5 h-3.5" /> },
  qr:    { bg: "bg-purple-50", text: "text-purple-700", icon: <Smartphone className="w-3.5 h-3.5" /> },

};

const ITEMS_PER_PAGE = 10;

export default function PaymentsPage() {
  const [payments, setPayments]       = useState<Payment[]>([]);
  const [pagination, setPagination]   = useState<Pagination | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchPayments() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(
          `/payment?page=${currentPage}&limit=${ITEMS_PER_PAGE}`
        );
        setPayments(res.data.payments ?? []);
        setPagination(res.data.pagination ?? null);
      } catch (err: any) {
        setError(err?.response?.data?.error ?? "Failed to load payments.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPayments();
  }, [currentPage]);

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const totalCount    = pagination?.total ?? payments.length;

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      String(p.orderNumber).includes(q) ||
      (p.tableNumber ?? "").toLowerCase().includes(q) ||
      p.method.toLowerCase().includes(q) ||
      p.orderType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="rounded-xl bg-[#0f6b4a] px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Payment Ledger</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border-l-4 border-l-[#18a172] border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Revenue</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              Rs. {totalReceived.toLocaleString()}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#0f6b4a]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open / Pending</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">Rs. 0</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-slate-400 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Transactions</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{totalCount}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by order, table, method..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#18a172] focus:outline-none focus:ring-1 focus:ring-[#18a172]"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Transaction Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Table / Type</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-slate-400">
                    No payments found.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => {
                  const ms = METHOD_STYLE[pay.method] ?? METHOD_STYLE.cash;
                  const tableLabel = pay.tableNumber ?? "Takeaway";
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0f6b4a] font-mono text-xs">
                        #{pay.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {pay.createdAtNepal}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex flex-col">
                          <span>{tableLabel}</span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {pay.orderType.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ms.bg} ${ms.text}`}>
                          {ms.icon}
                          {METHOD_LABEL[pay.method] ?? pay.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        Rs. {pay.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Staff-style pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <div className="text-sm text-slate-500" />
          <div className="flex items-center gap-6">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page {currentPage} of {pagination?.totalPages ?? 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination?.totalPages ?? 1))}
                disabled={currentPage === (pagination?.totalPages ?? 1)}
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