"use client";

import { useState } from "react";
import {
  CreditCard, Banknote, Smartphone, TrendingUp,
  Receipt, CheckCircle2, XCircle, Clock, Search, ChevronDown,
} from "lucide-react";

type PaymentStatus = "COMPLETED" | "PENDING" | "FAILED";

interface Payment {
  id: string;
  orderId: string;
  tableName: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  createdAt: string;
}

const SEED_PAYMENTS: Payment[] = [
  { id: "PAY-001", orderId: "ORD-1001", tableName: "T-01",          method: "Cash",  status: "COMPLETED", amount: 540,  createdAt: "2026-06-19T12:32:00" },
  { id: "PAY-002", orderId: "ORD-1002", tableName: "Quick Counter", method: "eSewa", status: "PENDING",   amount: 220,  createdAt: "2026-06-19T12:47:00" },
  { id: "PAY-003", orderId: "ORD-1003", tableName: "T-03",          method: "Card",  status: "COMPLETED", amount: 740,  createdAt: "2026-06-19T13:02:00" },
  { id: "PAY-004", orderId: "ORD-1004", tableName: "T-05",          method: "Cash",  status: "FAILED",    amount: 780,  createdAt: "2026-06-19T13:17:00" },
  { id: "PAY-005", orderId: "ORD-1005", tableName: "Quick Counter", method: "eSewa", status: "COMPLETED", amount: 590,  createdAt: "2026-06-19T13:32:00" },
  { id: "PAY-006", orderId: "ORD-1006", tableName: "T-02",          method: "Cash",  status: "PENDING",   amount: 180,  createdAt: "2026-06-19T13:47:00" },
];

const STATUS_STYLE: Record<PaymentStatus, { bg: string; text: string; dot: string; label: string }> = {
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Completed" },
  PENDING:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Pending"   },
  FAILED:    { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500",     label: "Failed"    },
};

const METHOD_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Cash:  { bg: "bg-emerald-50", text: "text-emerald-700", icon: <Banknote className="w-3.5 h-3.5" />  },
  Card:  { bg: "bg-blue-50",    text: "text-blue-700",    icon: <CreditCard className="w-3.5 h-3.5" /> },
  eSewa: { bg: "bg-purple-50",  text: "text-purple-700",  icon: <Smartphone className="w-3.5 h-3.5" /> },
};

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalReceived = SEED_PAYMENTS.filter(p => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0);
  const pendingVolume = SEED_PAYMENTS.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const paid    = SEED_PAYMENTS.filter(p => p.status === "COMPLETED").length;
  const pending = SEED_PAYMENTS.filter(p => p.status === "PENDING").length;
  const failed  = SEED_PAYMENTS.filter(p => p.status === "FAILED").length;

  const byMethod = ["Cash", "Card", "eSewa"].map(method => ({
    method,
    total: SEED_PAYMENTS.filter(p => p.method === method && p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0),
    count: SEED_PAYMENTS.filter(p => p.method === method && p.status === "COMPLETED").length,
  }));

  const filtered = SEED_PAYMENTS.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.orderId.toLowerCase().includes(q) ||
      p.tableName.toLowerCase().includes(q) ||
      p.method.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Payment Ledger</h1>

      </div>

    
{/* Summary Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Revenue</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">Rs. {totalReceived.toLocaleString()}</p>
    </div>
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
      <CheckCircle2 className="h-6 w-6" />
    </div>
  </div>

  <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open / Pending</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">Rs. {pendingVolume.toLocaleString()}</p>
    </div>
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
      <Clock className="h-6 w-6" />
    </div>
  </div>

  <div className="rounded-xl border-l-4 border-l-slate-400 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Transactions</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">{SEED_PAYMENTS.length}</p>
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
          placeholder="Search by ID, order, table, method..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Table / Counter</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    No payments match your search.
                  </td>
                </tr>
              ) : (
                paginated.map((pay) => {
                  const s  = STATUS_STYLE[pay.status];
                  const ms = METHOD_STYLE[pay.method] ?? { bg: "bg-slate-50", text: "text-slate-600", icon: <CreditCard className="w-3.5 h-3.5" /> };
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-emerald-600 font-mono text-xs">{pay.id}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {new Date(pay.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{pay.tableName}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ms.bg} ${ms.text}`}>
                          {ms.icon}{pay.method}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
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

        {/* Footer + Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
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
      </div>
    </div>
  );
}