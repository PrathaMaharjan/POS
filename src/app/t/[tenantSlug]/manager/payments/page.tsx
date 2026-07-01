"use client";

import { useState, useEffect } from "react";
import {
  CreditCard, Banknote, Smartphone, TrendingUp,
  CheckCircle2, Clock, Search, Loader2,
  ChevronLeft, ChevronRight, Calendar, X, Filter, Armchair, Utensils
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
  cash: "Cash",
  card: "Card",
  qr:   "QR",
};

const METHOD_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  cash: { bg: "bg-[#f0fdf4]", text: "text-[#0f6b4a]", icon: <Banknote className="w-3.5 h-3.5" />  },
  card: { bg: "bg-blue-50",   text: "text-blue-700",   icon: <CreditCard className="w-3.5 h-3.5" /> },
  qr:   { bg: "bg-purple-50", text: "text-purple-700", icon: <Smartphone className="w-3.5 h-3.5" /> },
};

const ITEMS_PER_PAGE = 10;

export default function PaymentsPage() {
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [pagination, setPagination]     = useState<Pagination | null>(null);
  const [totalAmount, setTotalAmount]   = useState<number>(0); // ← total across ALL pages
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [currentPage, setCurrentPage]   = useState(1);

  useEffect(() => {
    async function fetchPayments() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page:  String(currentPage),
          limit: String(ITEMS_PER_PAGE),
        });
        if (selectedDate)   params.set("date",   selectedDate);
        if (selectedMethod) params.set("method", selectedMethod);

        const res = await api.get(`/payment?${params.toString()}`);

        setPayments(res.data.payments ?? []);
        setPagination(res.data.pagination ?? null);
        // backend returns totalAmount when method filter is active
        setTotalAmount(res.data.totalAmount ?? res.data.payments?.reduce((s: number, p: Payment) => s + p.amount, 0) ?? 0);
      } catch (err: any) {
        setError(err?.response?.data?.error ?? "Failed to load payments.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPayments();
  }, [currentPage, selectedDate, selectedMethod]);

  const totalCount = pagination?.total ?? payments.length;

  // client-side text search (only filters what's already on this page)
  const filtered = payments.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(p.orderNumber).includes(q) ||
      (p.tableNumber ?? "").toLowerCase().includes(q) ||
      p.orderType.toLowerCase().includes(q)
    );
  });

  const handleDateChange = (v: string) => {
    setSelectedDate(v);
    setCurrentPage(1);
  };

  const handleMethodChange = (v: string) => {
    setSelectedMethod(v);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedDate("");
    setSelectedMethod("");
    setSearch("");
    setCurrentPage(1);
  };

  const hasFilters = !!(selectedDate || selectedMethod || search);

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="rounded-xl bg-[#0f6b4a] px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Payment Ledger</h1>
        {hasFilters && (
          <p className="text-sm text-emerald-100/70 mt-1">
            Showing filtered results
            {selectedMethod ? ` · ${METHOD_LABEL[selectedMethod] ?? selectedMethod} only` : ""}
            {selectedDate ? ` · ${selectedDate}` : ""}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border-l-4 border-l-[#18a172] border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {hasFilters ? "Filtered Revenue" : "Net Revenue"}
            </p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              Rs. {totalAmount.toLocaleString()}
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
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {hasFilters ? "Filtered Transactions" : "Transactions"}
            </p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{totalCount}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

    

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">

          {/* Text Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order No. or Table"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#18a172] focus:outline-none focus:ring-1 focus:ring-[#18a172]"
            />
          </div>

          {/* Date Picker */}
          <div className="relative w-full sm:w-44">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 focus:border-[#18a172] focus:outline-none focus:ring-1 focus:ring-[#18a172] cursor-pointer"
            />
          </div>

          {/* Method Dropdown */}
          <div className="relative w-full sm:w-44">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedMethod}
              onChange={(e) => handleMethodChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-700 focus:border-[#18a172] focus:outline-none focus:ring-1 focus:ring-[#18a172] cursor-pointer appearance-none"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="qr">QR</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-2.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-sm font-semibold text-slate-700">Transaction Log</h2>
          <div className="flex gap-2">
            {selectedDate && (
              <span className="text-[11px] bg-slate-50 text-slate-600 font-medium px-2.5 py-0.5 rounded-full border border-slate-200">
                Date: {selectedDate}
              </span>
            )}
            {selectedMethod && (
              <span className="text-[11px] bg-emerald-50 text-[#0f6b4a] font-medium px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
                {METHOD_LABEL[selectedMethod]}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Order No.</th>
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
                  <td colSpan={5} className="py-16 text-center text-sm text-red-500">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-slate-400">
                    No payments match criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => {
                  const ms = METHOD_STYLE[pay.method] ?? METHOD_STYLE.cash;
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0f6b4a] font-mono text-xs">
                        #{pay.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {pay.createdAtNepal}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          {pay.orderType === "dine_in" ? (
                            <Armchair className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <Utensils className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>
                            {pay.orderType === "dine_in"
                              ? `Dine In${pay.tableNumber ? ` · ${pay.tableNumber.toLowerCase().includes("table") ? pay.tableNumber : `Table ${pay.tableNumber}`}` : ""}`
                              : "Takeaway"}
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

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <span className="text-xs text-slate-400">
            {totalCount > 0
              ? `Showing ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)}–${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
              : "No results"}
          </span>
          <div className="flex items-center gap-6">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page {currentPage} of {pagination?.totalPages ?? 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, pagination?.totalPages ?? 1))}
                disabled={currentPage === (pagination?.totalPages ?? 1)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
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