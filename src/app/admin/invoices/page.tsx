"use client";

import { useState } from "react";
import { 
  Receipt, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from "lucide-react";

const MOCK_INVOICES = [
  {
    id: "INV-2026-001",
    orgName: "Burger House & Cafe",
    amount: "Rs. 12,500.00",
    status: "paid",
    date: "July 05, 2026",
    dueDate: "July 20, 2026",
    plan: "Pro Plan",
  },
  {
    id: "INV-2026-002",
    orgName: "Himalayan Java Coffee",
    amount: "Rs. 8,200.00",
    status: "paid",
    date: "July 04, 2026",
    dueDate: "July 19, 2026",
    plan: "Standard Plan",
  },
  {
    id: "INV-2026-003",
    orgName: "Pizza Central",
    amount: "Rs. 15,000.00",
    status: "pending",
    date: "July 01, 2026",
    dueDate: "July 16, 2026",
    plan: "Pro Plan",
  },
  {
    id: "INV-2026-004",
    orgName: "Organic Salad Bar",
    amount: "Rs. 4,500.00",
    status: "overdue",
    date: "June 20, 2026",
    dueDate: "July 05, 2026",
    plan: "Basic Plan",
  },
  {
    id: "INV-2026-005",
    orgName: "Sweet Treats Bakery",
    amount: "Rs. 4,500.00",
    status: "paid",
    date: "June 18, 2026",
    dueDate: "July 03, 2026",
    plan: "Basic Plan",
  },
];

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = MOCK_INVOICES.filter((invoice) => {
    const matchesSearch = invoice.orgName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-slate-500 mt-1">Manage billing and subscription payments for all organizations.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer">
          <Download className="w-4 h-4" />
          Export All Invoices
        </button>
      </div>

      {/* Stats Summary Card Group */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Invoiced</span>
            <h3 className="text-2xl font-bold text-slate-800">Rs. 44,700.00</h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% vs last month
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collected</span>
            <h3 className="text-2xl font-bold text-slate-800">Rs. 25,200.00</h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 56% collection rate
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding</span>
            <h3 className="text-2xl font-bold text-slate-800">Rs. 19,500.00</h3>
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 2 pending, 1 overdue
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice or org name..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {["all", "paid", "pending", "overdue"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subscription Plan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-800">{invoice.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-950">{invoice.orgName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {invoice.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{invoice.date}</td>
                    <td className="px-6 py-4 text-slate-500">{invoice.dueDate}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{invoice.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : invoice.status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {invoice.status === "paid" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {invoice.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                        {invoice.status === "overdue" && <AlertCircle className="w-3.5 h-3.5" />}
                        <span className="capitalize">{invoice.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No invoices found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
