"use client";

import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import {
  Plus, X, Pencil, Trash2, Search,
  Package, PackageCheck, PackageX, AlertTriangle,
  ChevronDown, Scale, Loader2, Sliders, History, Store
} from "lucide-react";
import api from "@/lib/api";

interface Outlet {
  id: string;
  name: string;
}

type StockLevel = "in_stock" | "low_stock" | "out_of_stock";

interface Material {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  minStockLevel: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  name: "",
  currentStock: "" as number | "",
  unit: "kg" as "g" | "kg" | "ml" | "L" | "pieces",
  minStockLevel: "" as number | "",
};

function getStockLevel(m: Material): StockLevel {
  if (m.isOutOfStock) return "out_of_stock";
  if (m.isLowStock) return "low_stock";
  return "in_stock";
}

const STOCK_STYLE: Record<StockLevel, { bg: string; text: string; dot: string; label: string }> = {
  in_stock: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "In Stock" },
  low_stock: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Low Stock Alert" },
  out_of_stock: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Out of Stock" },
};

export default function ManagerInventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"ALL" | StockLevel>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingMaterial, setAdjustingMaterial] = useState<Material | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustType: "purchase" as "purchase" | "adjustment",
    quantity: "" as number | "",
    newQuantity: "" as number | "",
    note: ""
  });
  const [adjusting, setAdjusting] = useState(false);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState("");

  // ── Outlet state ──────────────────────────────────────────────────────────
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeOutletId, setActiveOutletId] = useState<string>("");
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        setErrorMsg(err?.response?.data?.error ?? "Failed to load outlets.");
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

  const handleOutletChange = (id: string) => {
    localStorage.setItem("activeOutletId", id);
    setActiveOutletId(id);
    setCurrentPage(1);
    setOutletDropdownOpen(false);
  };

  const fetchMaterials = useCallback(async () => {
    if (!activeOutletId) return;
    setLoading(true);
    try {
      const res = await api.get(`/inventory?outletId=${activeOutletId}`);
      setMaterials(res.data.stockItems ?? []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [activeOutletId]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const stats = useMemo(() => ({
    total: materials.length,
    inStock: materials.filter(m => getStockLevel(m) === "in_stock").length,
    lowStock: materials.filter(m => getStockLevel(m) === "low_stock").length,
    outOfStock: materials.filter(m => getStockLevel(m) === "out_of_stock").length,
  }), [materials]);

  const filtered = useMemo(() => materials.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchStock = stockFilter === "ALL" || getStockLevel(m) === stockFilter;
    return matchSearch && matchStock;
  }), [materials, search, stockFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingMaterial(null);
    setIsModalOpen(true);
  }

  function openEdit(m: Material) {
    setEditingMaterial(m);
    setForm({ name: m.name, currentStock: m.currentStock, unit: m.unit as typeof EMPTY_FORM["unit"], minStockLevel: m.minStockLevel });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingMaterial(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;


    const normalizedNewName = form.name.trim().toLowerCase();
    const isDuplicate = materials.some(m =>
      m.name.toLowerCase() === normalizedNewName &&
      (!editingMaterial || m.id !== editingMaterial.id)
    );
    if (isDuplicate) {
      setDuplicateName(form.name.trim());
      setShowDuplicateModal(true);
      return;
    }

    setSaving(true);
    try {
      if (editingMaterial) {
        await api.patch(`/inventory/${editingMaterial.id}`, {
          name: form.name.trim(),
          minStockLevel: Number(form.minStockLevel) || 0,
          outletId: activeOutletId,
        });
      } else {
        await api.post("/inventory", {
          name: form.name.trim(),
          unit: form.unit,
          currentStock: Number(form.currentStock) || 0,
          minStockLevel: Number(form.minStockLevel) || 0,
          outletId: activeOutletId,
        });
      }
      await fetchMaterials();
      closeModal();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setDuplicateName(form.name.trim());
        setShowDuplicateModal(true);
      } else {
        console.error("Error saving inventory item:", error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.delete(`/inventory/${id}?outletId=${activeOutletId}`);
      setDeleteConfirmId(null);
      await fetchMaterials();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
    } finally {
      setDeleting(false);
    }
  }

  function openAdjust(m: Material) {
    setAdjustingMaterial(m);
    setAdjustForm({ adjustType: "purchase", quantity: "", newQuantity: m.currentStock, note: "" });
    setIsAdjustModalOpen(true);
  }

  function closeAdjustModal() {
    setIsAdjustModalOpen(false);
    setAdjustingMaterial(null);
    setAdjustForm({ adjustType: "purchase", quantity: "", newQuantity: "", note: "" });
  }

  async function handleSaveAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustingMaterial) return;

    const isPurchase = adjustForm.adjustType === "purchase";
    const amount = isPurchase ? adjustForm.quantity : adjustForm.newQuantity;
    if (amount === "") return;

    setAdjusting(true);
    try {
      const endpoint = isPurchase
        ? `/inventory/${adjustingMaterial.id}/purchase`
        : `/inventory/${adjustingMaterial.id}/adjustment`;

      const payload = isPurchase
        ? { quantity: Number(amount), note: adjustForm.note.trim() || undefined, outletId: activeOutletId }
        : { newQuantity: Number(amount), note: adjustForm.note.trim() || undefined, outletId: activeOutletId };

      const res = await api.post(endpoint, payload);
      const { newStock } = res.data;
      setMaterials(prev => prev.map(m =>
        m.id === adjustingMaterial.id
          ? { ...m, currentStock: newStock, isOutOfStock: newStock <= 0, isLowStock: newStock <= m.minStockLevel && m.minStockLevel > 0 }
          : m
      ));
      closeAdjustModal();
    } catch (error) {
      console.error("Error adjusting stock item:", error);
    } finally {
      setAdjusting(false);
    }
  }

  async function toggleExpandRow(itemId: string) {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
      setMovements([]);
      setHistoryDateFilter("");
      return;
    }
    setExpandedItemId(itemId);
    setHistoryDateFilter("");
    setLoadingHistory(true);
    try {
      const res = await api.get(`/inventory/${itemId}/movement?outletId=${activeOutletId}`);
      setMovements(res.data.movements ?? []);
    } catch (error) {
      console.error("Error fetching movement history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Raw Materials Inventory</h1>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
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
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-100">
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Ingredients", value: stats.total, border: "border-l-slate-400", iconBg: "bg-slate-50 text-slate-600", icon: <Package className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Optimal Stock", value: stats.inStock, border: "border-l-emerald-500", iconBg: "bg-emerald-50 text-emerald-600", icon: <PackageCheck className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Critical Stock", value: stats.lowStock, border: "border-l-amber-500", iconBg: "bg-amber-50 text-amber-600", icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "No stock", value: stats.outOfStock, border: "border-l-red-500", iconBg: "bg-red-50 text-red-500", icon: <PackageX className="h-5 w-5 sm:h-6 sm:w-6" /> },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border-l-4 ${s.border} border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between`}>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search ingredients"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={stockFilter}
          onChange={e => { setStockFilter(e.target.value as typeof stockFilter); setCurrentPage(1); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 focus:border-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Volumes</option>
          <option value="in_stock">Stable</option>
          <option value="low_stock">Low Alert</option>
          <option value="out_of_stock">Depleted</option>
        </select>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors sm:ml-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add Raw Ingredient
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Current Stock Level</th>
                <th className="py-3 px-4">Threshold Alert</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading inventory...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    No raw materials match criteria.
                  </td>
                </tr>
              ) : paginated.map(material => {
                const stockLevel = getStockLevel(material);
                const stockStyle = STOCK_STYLE[stockLevel];
                return (
                  <Fragment key={material.id}>
                    <tr
                      onClick={() => toggleExpandRow(material.id)}
                      className={`hover:bg-slate-50/50 transition-colors text-slate-700 cursor-pointer ${expandedItemId === material.id ? "bg-slate-50/50 border-l-2 border-emerald-500" : ""
                        }`}
                    >

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${expandedItemId === material.id ? "rotate-180 text-emerald-600 animate-pulse" : ""
                            }`} />
                          <span className="font-semibold text-slate-800">{material.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">
                          {material.currentStock} <span className="text-xs font-normal text-slate-400">{material.unit}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-500">
                        &lt; {material.minStockLevel} {material.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${stockStyle.bg} ${stockStyle.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stockStyle.dot}`} />
                          {stockStyle.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                        {new Date(material.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={(e) => { e.stopPropagation(); openAdjust(material); }}
                            title="Adjust Stock"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                            <Sliders className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); openEdit(material); }}
                            title="Edit Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(material.id); }}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedItemId === material.id && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={6} className="px-4 py-4 border-b border-slate-100">
                          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm w-full animate-in slide-in-from-top-2 duration-200">

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5" /> Stock Movement History
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-semibold">Filter by Date:</span>
                                <input
                                  type="date"
                                  value={historyDateFilter}
                                  onChange={e => setHistoryDateFilter(e.target.value)}
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 focus:border-emerald-500 focus:outline-none"
                                />
                                {historyDateFilter && (
                                  <button
                                    type="button"
                                    onClick={() => setHistoryDateFilter("")}
                                    className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>

                            {loadingHistory ? (
                              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> Loading logs...
                              </div>
                            ) : movements.length === 0 ? (
                              <p className="text-xs text-slate-400 py-2">No stock movements recorded for this item.</p>
                            ) : (() => {
                              const filteredMovements = movements.filter((m: any) => {
                                if (!historyDateFilter) return true;
                                const mDate = new Date(m.createdAt).toISOString().split("T")[0];
                                return mDate === historyDateFilter;
                              });

                              if (filteredMovements.length === 0) {
                                return <p className="text-xs text-slate-400 py-2">No stock movements recorded on this date.</p>;
                              }

                              return (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                  {filteredMovements.map((m: any) => {
                                    let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                                    if (m.type === "purchase") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                    if (m.type === "wastage") badgeColor = "bg-red-50 text-red-700 border-red-100";
                                    if (m.type === "adjustment") badgeColor = "bg-amber-50 text-amber-700 border-amber-100";

                                    return (
                                      <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs">
                                        <div className="flex items-start gap-2.5">
                                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border shrink-0 ${badgeColor}`}>
                                            {m.type}
                                          </span>
                                          <div>
                                            <p className="font-semibold text-slate-800">
                                              {m.type === "purchase" ? "+" : m.type === "wastage" ? "-" : ""}
                                              {m.quantity} <span className="text-[10px] font-normal text-slate-400">{material.unit}</span>
                                            </p>
                                            {m.note && (
                                              <p className="text-slate-500 mt-0.5 font-medium">
                                                Note: {m.note}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end shrink-0 text-[10px]">
                                          <p className="text-slate-400">
                                            {new Date(m.createdAt).toLocaleString()}
                                          </p>
                                          {m.createdBy?.name && (
                                            <p className="font-semibold text-slate-500 mt-0.5">
                                              by {m.createdBy.name}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold ${currentPage === p ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-500"}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30">
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
            <div className="flex flex-col items-center text-center gap-3 p-6 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Material?</h3>
                <p className="text-sm text-slate-500 mt-1">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 p-6">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 font-medium text-sm py-2.5 rounded-lg">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} disabled={deleting}
                className="flex-1 bg-red-500 text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative flex flex-col items-center p-6 bg-emerald-600 text-white">
              <Scale className="h-7 w-7 mb-1" />
              <h3 className="text-xl font-semibold">
                {editingMaterial ? "Edit Raw Ingredient" : "Register Raw Ingredient"}
              </h3>
              <button onClick={closeModal} className="absolute right-6 top-6 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Ingredient Name</label>
                  <input
                    type="text" required placeholder=""
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</label>
                  <select
                    disabled={!!editingMaterial}
                    value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value as typeof EMPTY_FORM["unit"] }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="L">Liters (L)</option>
                    <option value="pieces">Pieces</option>
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Low Stock Warning Threshold</label>
                  <input
                    type="number" step="1" min={0}
                    placeholder=""
                    value={form.minStockLevel}
                    onChange={e => setForm(p => ({ ...p, minStockLevel: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={closeModal}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-600">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingMaterial ? "Apply Modification" : "Add Inventory"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}



      {isAdjustModalOpen && adjustingMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeAdjustModal}>
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative flex flex-col items-center p-6 bg-emerald-600 text-white">
              <Sliders className="h-7 w-7 mb-1" />
              <h3 className="text-xl font-semibold">
                Stock Level
              </h3>

              <button onClick={closeAdjustModal} className="absolute right-6 top-6 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveAdjust} className="space-y-4">
                {/* Mode Selector */}
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAdjustForm(p => ({ ...p, adjustType: "purchase" }))}
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all ${
                      adjustForm.adjustType === "purchase"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Restock (Purchase)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm(p => ({ ...p, adjustType: "adjustment" }))}
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all ${
                      adjustForm.adjustType === "adjustment"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Manual Adjustment
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {adjustForm.adjustType === "purchase" ? (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Purchase Quantity</label>
                      <input
                        type="number" step="1" min={1} required
                        placeholder="e.g. 5.0"
                        value={adjustForm.quantity}
                        onChange={e => setAdjustForm(p => ({ ...p, quantity: e.target.value === "" ? "" : Number(e.target.value) }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">New Stock Count</label>
                      <input
                        type="number" step="1" min={0} required
                        placeholder="e.g. 17.5"
                        value={adjustForm.newQuantity}
                        onChange={e => setAdjustForm(p => ({ ...p, newQuantity: e.target.value === "" ? "" : Number(e.target.value) }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</label>
                    <input
                      type="text" disabled
                      value={adjustingMaterial.unit}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-400 bg-slate-50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {adjustForm.adjustType === "purchase" ? "Purchase Note / Invoice Reference" : "Adjustment Reason / Note"}
                  </label>
                  <input
                    type="text" placeholder=""
                    value={adjustForm.note} onChange={e => setAdjustForm(p => ({ ...p, note: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={closeAdjustModal}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-600">Cancel</button>
                  <button type="submit" disabled={adjusting}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {adjusting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {adjusting
                      ? "Saving..."
                      : adjustForm.adjustType === "purchase"
                        ? "Save Purchase"
                        : "Apply Adjustment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Alert Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center gap-3 p-6 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Already Exists</h3>
                <p className="text-sm text-slate-500 mt-1">
                  A raw material named <span className="font-semibold text-slate-800">&quot;{duplicateName}&quot;</span> already exists in your inventory.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}