"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CreditCard, Banknote, Smartphone, TrendingUp,
  CheckCircle2, Clock, Search, Loader2,
  ChevronLeft, ChevronRight, Calendar, X, Filter,
  Store, ChevronDown
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

interface Outlet {
  id: string;
  name: string;
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  qr: "QR",
};

const METHOD_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  cash: { bg: "bg-[#f0fdf4]", text: "text-[#0f6b4a]", icon: <Banknote className="w-3.5 h-3.5" /> },
  card: { bg: "bg-blue-50", text: "text-blue-700", icon: <CreditCard className="w-3.5 h-3.5" /> },
  qr: { bg: "bg-purple-50", text: "text-purple-700", icon: <Smartphone className="w-3.5 h-3.5" /> },
};

const ITEMS_PER_PAGE = 10;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Outlet state ──────────────────────────────────────────────────────────
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeOutletId, setActiveOutletId] = useState<string>("");
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);

  const activeOutlet = outlets.find((o) => o.id === activeOutletId);

  // 1. Fetch outlets on mount
  useEffect(() => {
    async function initOutlets() {
      try {
        const res = await api.get("/outlets");
        const list: Outlet[] = res.data.outlets ?? [];
        setOutlets(list);

        const stored = localStorage.getItem("activeOutletId");
        if (stored && list.some((o) => o.id === stored)) {
          setActiveOutletId(stored);
        } else if (list.length > 0) {
          setActiveOutletId(list[0].id);
        }
      } catch (err: any) {
        setError(err?.response?.data?.error ?? "Failed to load outlets.");
      }
    }
    initOutlets();
  }, []);

  // 2. Close outlet dropdown on outside click
  useEffect(() => {
    if (!outletDropdownOpen) return;
    const handler = () => setOutletDropdownOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [outletDropdownOpen]);

  // 3. Fetch all payments whenever outlet / date / method changes
  useEffect(() => {
    if (!activeOutletId) return;

    async function fetchPayments() {
      setIsLoading(true);
      setError(null);
      try {
        let allPayments: Payment[] = [];
        let page = 1;
        let totalPages = 1;
        let totalAmountSum = 0;

        // Fetch first page with max limit (100) to minimize requests
        const params = new URLSearchParams({
          page: String(page),
          limit: "100",
          outletId: activeOutletId,
        });
        if (selectedDate) params.set("date", selectedDate);
        if (selectedMethod) params.set("method", selectedMethod);

        const res = await api.get(`/payment?${params.toString()}`);
        allPayments = res.data.payments ?? [];
        totalPages = res.data.pagination?.totalPages ?? 1;
        totalAmountSum = res.data.totalAmount ?? 0;

        // Fetch remaining pages in parallel if there are more
        if (totalPages > 1) {
          const promises = [];
          for (let p = 2; p <= totalPages; p++) {
            const pageParams = new URLSearchParams({
              page: String(p),
              limit: "100",
              outletId: activeOutletId,
            });
            if (selectedDate) pageParams.set("date", selectedDate);
            if (selectedMethod) pageParams.set("method", selectedMethod);
            promises.push(api.get(`/payment?${pageParams.toString()}`));
          }
          const responses = await Promise.all(promises);
          responses.forEach((r) => {
            allPayments = allPayments.concat(r.data.payments ?? []);
          });
        }

        setPayments(allPayments);
        // Calculate total amount from all payments if not accurate or returned by server
        setTotalAmount(
          totalAmountSum ||
          allPayments.reduce((s: number, p: Payment) => s + p.amount, 0)
        );
      } catch (err: any) {
        setError(err?.response?.data?.error ?? "Failed to load payments.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPayments();
  }, [selectedDate, selectedMethod, activeOutletId]);

  const handleOutletChange = (id: string) => {
    localStorage.setItem("activeOutletId", id);
    setActiveOutletId(id);
    setCurrentPage(1);
    setOutletDropdownOpen(false);
  };

  // Client-side text search (filters all loaded payments)
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(p.orderNumber).includes(q) ||
        (p.tableNumber ?? "").toLowerCase().includes(q) ||
        p.orderType.toLowerCase().includes(q) ||
        String(p.amount).includes(q)
      );
    });
  }, [payments, search]);

  const totalCount = filtered.length;
  const totalPages = Math.max(Math.ceil(totalCount / ITEMS_PER_PAGE), 1);

  // Paginated chunk for current page
  const paginatedPayments = useMemo(() => {
    return filtered.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filtered, currentPage]);

  const filteredRevenue = useMemo(() => {
    return filtered.reduce((s, p) => s + p.amount, 0);
  }, [filtered]);

  const handleDateChange = (v: string) => { setSelectedDate(v); setCurrentPage(1); };
  const handleMethodChange = (v: string) => { setSelectedMethod(v); setCurrentPage(1); };

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
      <div className="rounded-xl bg-[#0f6b4a] px-6 py-5 text-white shadow-sm flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payment Ledger</h1>
          {hasFilters && (
            <p className="text-sm text-emerald-100/70 mt-1">
              Showing filtered results
              {selectedMethod ? ` · ${METHOD_LABEL[selectedMethod] ?? selectedMethod} only` : ""}
              {selectedDate ? ` · ${selectedDate}` : ""}
            </p>
          )}
        </div>

        {/* Outlet picker */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOutletDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border bg-white text-emerald-700 border-white shadow-sm transition-colors"
          >
            <Store className="w-4 h-4 shrink-0" />
            <span className="max-w-[120px] truncate">
              {activeOutlet?.name ?? "Select Outlet"}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${outletDropdownOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {outletDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Select Outlet
                </p>
              </div>
              <div className="py-1">
                {outlets.map((outlet) => (
                  <button
                    key={outlet.id}
                    onClick={() => handleOutletChange(outlet.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${activeOutletId === outlet.id
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${activeOutletId === outlet.id ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                    />
                    {outlet.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border-l-4 border-l-[#18a172] border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {search.trim() ? "Search Results Revenue" : hasFilters ? "Filtered Revenue" : "Net Revenue"}
            </p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              Rs. {(search.trim() ? filteredRevenue : totalAmount).toLocaleString()}
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
              {search.trim() ? "Search Transactions" : hasFilters ? "Filtered Transactions" : "Transactions"}
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
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order No. or Table"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
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
            {activeOutlet && (
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2.5 py-0.5 rounded-full border border-emerald-100">
                {activeOutlet.name}
              </span>
            )}
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
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-slate-400">
                    No payments match criteria.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((pay) => {
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

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <span className="text-xs text-slate-400">
            {totalCount > 0
              ? `Showing ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)}–${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
              : "No results"}
          </span>
          <div className="flex items-center gap-6">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page {currentPage} of {totalPages}
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
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
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