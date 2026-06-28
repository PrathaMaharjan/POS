"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus, X, Pencil, Trash2, Search,
  Package, PackageCheck, PackageX, AlertTriangle,
  ChevronDown, Scale, Loader2
} from "lucide-react";
import api from "@/lib/api";

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

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory");
      setMaterials(res.data.stockItems ?? []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    setSaving(true);
    try {
      if (editingMaterial) {
        await api.patch(`/inventory/${editingMaterial.id}`, {
          name: form.name.trim(),
          minStockLevel: Number(form.minStockLevel) || 0,
        });
      } else {
        await api.post("/inventory", {
          name: form.name.trim(),
          unit: form.unit,
          currentStock: Number(form.currentStock) || 0,
          minStockLevel: Number(form.minStockLevel) || 0,
        });
      }
      await fetchMaterials();
      closeModal();
    } catch (error) {
      console.error("Error saving inventory item:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.delete(`/inventory/${id}`);
      setDeleteConfirmId(null);
      await fetchMaterials();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
    } finally {
      setDeleting(false);
    }
  }

  async function handlePurchase(id: string) {
    try {
      const res = await api.post(`/inventory/${id}/purchase`, { quantity: 1 });
      const { newStock } = res.data;
      setMaterials(prev => prev.map(m =>
        m.id === id
          ? { ...m, currentStock: newStock, isOutOfStock: newStock <= 0, isLowStock: newStock <= m.minStockLevel && m.minStockLevel > 0 }
          : m
      ));
    } catch (error) {
      console.error("Error purchasing stock item:", error);
    }
  }

  function handleDecrement(id: string) {
    setMaterials(prev => prev.map(m => {
      if (m.id !== id) return m;
      const newStock = Math.max(0, Number((m.currentStock - 1).toFixed(3)));
      return { ...m, currentStock: newStock, isOutOfStock: newStock <= 0, isLowStock: newStock <= m.minStockLevel && m.minStockLevel > 0 };
    }));
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Raw Materials Inventory</h1>
          <p className="text-sm text-emerald-100/80 mt-1">Track store ingredients, weight metrics, and kitchen stock constraints</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add Raw Ingredient
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Commodities", value: stats.total, icon: <Package className="h-5 w-5" />, iconBg: "bg-slate-50 text-slate-600" },
          { label: "Optimal Stock", value: stats.inStock, icon: <PackageCheck className="h-5 w-5" />, iconBg: "bg-emerald-50 text-emerald-600" },
          { label: "Critical Stock", value: stats.lowStock, icon: <AlertTriangle className="h-5 w-5" />, iconBg: "bg-amber-50 text-amber-600" },
          { label: "Depleted Items", value: stats.outOfStock, icon: <PackageX className="h-5 w-5" />, iconBg: "bg-red-50 text-red-500" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconBg}`}>{s.icon}</div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>


      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search ingredients (sugar, milk...)"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "in_stock", "low_stock", "out_of_stock"] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStockFilter(s); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${stockFilter === s
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
            >
              {s === "ALL" ? "All Volumes" : s === "in_stock" ? "Stable" : s === "low_stock" ? "Low Alert" : "Depleted"}
            </button>
          ))}
        </div>
      </div>


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
                  <tr key={material.id} className="hover:bg-slate-50/50 transition-colors text-slate-700">
                    {/* Name only — no ID */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{material.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrement(material.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 font-bold transition-colors"
                        >-</button>
                        <span className="font-bold text-slate-800 min-w-12 text-center">
                          {material.currentStock} <span className="text-xs font-normal text-slate-400">{material.unit}</span>
                        </span>
                        <button
                          onClick={() => handlePurchase(material.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 font-bold transition-colors"
                        >+</button>
                      </div>
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
                        <button onClick={() => openEdit(material)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(material.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
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
                    type="text" required placeholder="e.g. Sugar, Milk, Coffee Beans"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock Quantity</label>
                    <input
                      type="number" step="0.01" min={0}
                      placeholder="e.g. 25"
                      disabled={!!editingMaterial}
                      value={form.currentStock}
                      onChange={e => setForm(p => ({ ...p, currentStock: e.target.value === "" ? "" : Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
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
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Low Stock Warning Threshold</label>
                  <input
                    type="number" step="0.1" min={0}
                    placeholder="e.g. 10"
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
    </div>
  );
}