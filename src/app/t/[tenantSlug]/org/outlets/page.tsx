"use client";

import { useState } from "react";
import {
  Store,
  MapPin,
  Search,
  X,
  Pencil,
  Trash2,
  Building2,
  CheckCircle,
  XCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Outlet {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
}

const SEED_OUTLETS: Outlet[] = [
  {
    id: "1",
    name: "Kathmandu Main Branch",
    phone: "9801234567",
    address: "Durbar Marg, Kathmandu",
    status: "active",
  },
  {
    id: "2",
    name: "Lalitpur Hub",
    phone: "9807654321",
    address: "Jhamsikhel, Lalitpur",
    status: "active",
  },
  {
    id: "3",
    name: "Pokhara Lakeside",
    phone: "9809876543",
    address: "Lakeside Street No. 4, Pokhara",
    status: "inactive",
  },
];

const ITEMS_PER_PAGE = 8;

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>(SEED_OUTLETS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const totalOutlets = outlets.length;
  const activeOutlets = outlets.filter((o) => o.status === "active").length;
  const inactiveOutlets = outlets.filter((o) => o.status === "inactive").length;

  const filteredOutlets = outlets.filter(
    (outlet) =>
      outlet.name.toLowerCase().includes(search.toLowerCase()) ||
      outlet.phone.includes(search)
  );

  const totalItems = filteredOutlets.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginatedOutlets = filteredOutlets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function resetForm() {
    setForm({ name: "", phone: "", address: "" });
    setEditingOutlet(null);
  }

  function handleOpenEdit(outlet: Outlet) {
    setEditingOutlet(outlet);
    setForm({ name: outlet.name, phone: outlet.phone, address: outlet.address });
    setIsModalOpen(true);
  }

  function handleSaveOutlet() {
    if (!form.name || !form.address) return;

    if (editingOutlet) {
      setOutlets((prev) =>
        prev.map((o) =>
          o.id === editingOutlet.id
            ? { ...o, name: form.name, phone: form.phone, address: form.address }
            : o
        )
      );
    } else {
      const newOutlet: Outlet = {
        id: crypto.randomUUID(),
        name: form.name,
        phone: form.phone,
        address: form.address,
        status: "active",
      };
      setOutlets((prev) => [newOutlet, ...prev]);
      setCurrentPage(1);
    }

    resetForm();
    setIsModalOpen(false);
  }

  function handleDeleteOutlet(id: string) {
    if (confirm("Are you sure you want to remove this outlet branch?")) {
      setOutlets((prev) => prev.filter((o) => o.id !== id));
    }
  }

  function toggleStatus(id: string) {
    setOutlets((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: o.status === "active" ? "inactive" : "active" } : o
      )
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Outlets</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-l-4 border-l-slate-400 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Outlets</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{totalOutlets}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-[#18a172] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{activeOutlets}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#0f6b4a]">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Inactive</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{inactiveOutlets}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search by outlet name or phone..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <Store className="h-4 w-4" />
          Add Outlet
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Outlet Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOutlets.map((outlet) => (
                <tr key={outlet.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <Store className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-slate-900">{outlet.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-mono text-xs font-semibold text-slate-600">
                        {outlet.phone || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{outlet.address}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => toggleStatus(outlet.id)}
                      title="Click to toggle status"
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${
                        outlet.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${outlet.status === "active" ? "bg-emerald-600" : "bg-slate-400"}`} />
                      {outlet.status === "active" ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(outlet)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Edit Outlet"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOutlet(outlet.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Remove Outlet"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedOutlets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    No outlets match your search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-6 border-t border-slate-100 bg-white px-6 py-4">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Page {activePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={activePage === 1}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={activePage === totalPages}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-t-2xl sm:rounded-xl bg-white shadow-xl border border-slate-100 overflow-y-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col"
          >
            {/* Modal header */}
            <div className="relative flex flex-col items-center justify-center bg-emerald-600 p-5 text-white shrink-0">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Store className="h-6 w-6 text-white mb-0.5" />
                <h2 className="text-lg font-semibold text-white">
                  {editingOutlet ? "Modify Outlet Details" : "Register New Outlet"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-col gap-5 p-5 md:p-6 overflow-y-auto">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">Outlet Branch Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter the name of branch"
                  className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    maxLength={15}
                    className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Enter your location"
                    className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5 md:p-6 bg-slate-50/50 rounded-b-xl shrink-0 pb-6 sm:pb-5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 sm:flex-initial rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOutlet}
                className="flex-1 sm:flex-initial rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                {editingOutlet ? "Save Changes" : "Register Outlet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}