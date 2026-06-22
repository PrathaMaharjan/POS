"use client";

import { useState, useMemo } from "react";
import {
  Plus, X, Pencil, Trash2, Search,
  Package, PackageCheck, PackageX, AlertTriangle,
  ChevronDown, Scale
} from "lucide-react";

type StockLevel = "in_stock" | "low_stock" | "out_of_stock";

interface Material {
  id: string;
  name: string;
  category: string;
  stock: number;         // Decimal quantity tracking
  unit: string;          // kg, L, pcs, bags, etc.
  lowStockThreshold: number;
  lastRestocked: string;
}

interface Category {
  id: string;
  name: string;
}

const SEED_CATEGORIES: Category[] = [
  { id: "1", name: "Dairy & Eggs" },
  { id: "2", name: "Sweeteners" },
  { id: "3", name: "Dry Goods & Flour" },
  { id: "4", name: "Beverage Bases" }, // Coffee Beans, Tea Leaves
  { id: "5", name: "Packaging & Disposables" },
];

const SEED_MATERIALS: Material[] = [
  { id: "MAT-001", name: "Whole Milk",       category: "Dairy & Eggs",          stock: 45,   unit: "L",   lowStockThreshold: 15, lastRestocked: "2026-06-20" },
  { id: "MAT-002", name: "Espresso Beans",   category: "Beverage Bases",         stock: 8,    unit: "kg",  lowStockThreshold: 12, lastRestocked: "2026-06-18" },
  { id: "MAT-003", name: "White Sugar",      category: "Sweeteners",             stock: 25,   unit: "kg",  lowStockThreshold: 5,  lastRestocked: "2026-06-15" },
  { id: "MAT-004", name: "All-Purpose Flour",category: "Dry Goods & Flour",       stock: 0,    unit: "kg",  lowStockThreshold: 10, lastRestocked: "2026-05-29" },
  { id: "MAT-005", name: "Green Tea Leaves", category: "Beverage Bases",         stock: 4.5,  unit: "kg",  lowStockThreshold: 2,  lastRestocked: "2026-06-11" },
  { id: "MAT-006", name: "Paper Cups 12oz",  category: "Packaging & Disposables",stock: 500,  unit: "pcs", lowStockThreshold: 150,lastRestocked: "2026-06-19" },
  { id: "MAT-007", name: "Heavy Cream",      category: "Dairy & Eggs",          stock: 3,    unit: "L",   lowStockThreshold: 5,  lastRestocked: "2026-06-21" },
];

const EMPTY_FORM = {
  name: "",
  category: SEED_CATEGORIES[0].name,
  stock: 0,
  unit: "kg",
  lowStockThreshold: 5,
};

function getStockLevel(stock: number, threshold: number): StockLevel {
  if (stock === 0) return "out_of_stock";
  if (stock <= threshold) return "low_stock";
  return "in_stock";
}

const STOCK_STYLE: Record<StockLevel, { bg: string; text: string; dot: string; label: string }> = {
  in_stock:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "In Stock"     },
  low_stock:    { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Low Stock Alert"},
  out_of_stock: { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500",     label: "Out of Stock" },
};

export default function ManagerInventoryPage() {
  const [materials, setMaterials] = useState<Material[]>(SEED_MATERIALS);
  const [categories] = useState<Category[]>(SEED_CATEGORIES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | StockLevel>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // ── Analytics / Performance Summary ─────────────────────────────────────────
  const stats = useMemo(() => {
    const total = materials.length;
    const inStock = materials.filter(m => getStockLevel(m.stock, m.lowStockThreshold) === "in_stock").length;
    const lowStock = materials.filter(m => getStockLevel(m.stock, m.lowStockThreshold) === "low_stock").length;
    const outOfStock = materials.filter(m => getStockLevel(m.stock, m.lowStockThreshold) === "out_of_stock").length;
    return { total, inStock, lowStock, outOfStock };
  }, [materials]);

  // ── Query Pipeline ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return materials.filter(m => {
      const q = search.toLowerCase();
      const matchSearch = m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "ALL" || m.category === categoryFilter;
      const matchStock = stockFilter === "ALL" || getStockLevel(m.stock, m.lowStockThreshold) === stockFilter;
      return matchSearch && matchCategory && matchStock;
    });
  }, [materials, search, categoryFilter, stockFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── Mutation Triggers ──────────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingMaterial(null);
    setIsModalOpen(true);
  }

  // Adjusted to use explicit typing for page routing safety
  function openEdit(material: Material) {
    setEditingMaterial(material);
    setForm({
      name: material.name,
      category: material.category,
      stock: material.stock,
      unit: material.unit,
      lowStockThreshold: material.lowStockThreshold,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingMaterial(null);
    setForm(EMPTY_FORM);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingMaterial) {
      setMaterials(prev =>
        prev.map(m => m.id === editingMaterial.id ? {
          ...m,
          name: form.name.trim(),
          category: form.category,
          stock: form.stock,
          unit: form.unit,
          lowStockThreshold: form.lowStockThreshold,
        } : m)
      );
    } else {
      setMaterials(prev => [...prev, {
        id: `MAT-${Math.floor(100 + Math.random() * 900)}`,
        name: form.name.trim(),
        category: form.category,
        stock: form.stock,
        unit: form.unit,
        lowStockThreshold: form.lowStockThreshold,
        lastRestocked: new Date().toISOString().split('T')[0],
      }]);
    }
    closeModal();
  }

  function handleDelete(id: string) {
    setMaterials(prev => prev.filter(m => m.id !== id));
    setDeleteConfirmId(null);
  }

  function handleStockAdjust(id: string, delta: number) {
    setMaterials(prev =>
      prev.map(m => m.id === id
        ? { ...m, stock: Math.max(0, Number((m.stock + delta).toFixed(2))) }
        : m
      )
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Dynamic Action Header */}
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

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Commodities", value: stats.total,      icon: <Package className="h-5 w-5" />,       iconBg: "bg-slate-50 text-slate-600"     },
          { label: "Optimal Stock",    value: stats.inStock,    icon: <PackageCheck className="h-5 w-5" />,  iconBg: "bg-emerald-50 text-emerald-600" },
          { label: "Critical Stock",   value: stats.lowStock,   icon: <AlertTriangle className="h-5 w-5" />, iconBg: "bg-amber-50 text-amber-600"     },
          { label: "Depleted Items",   value: stats.outOfStock, icon: <PackageX className="h-5 w-5" />,      iconBg: "bg-red-50 text-red-500"          },
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

      {/* Grid Filter Toolkit */}
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

        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 focus:border-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <div className="flex gap-2 flex-wrap">
          {(["ALL", "in_stock", "low_stock", "out_of_stock"] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStockFilter(s); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                stockFilter === s
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s === "ALL" ? "All Volumes" : s === "in_stock" ? "Stable" : s === "low_stock" ? "Low Alert" : "Depleted"}
            </button>
          ))}
        </div>
      </div>

      {/* Master Inventory Logs */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Material Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Stock Level</th>
                <th className="py-3 px-4">Threshold Alert</th>
                <th className="py-3 px-4">Status Balance</th>
                <th className="py-3 px-4">Last Stock Interaction</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    No raw materials match criteria.
                  </td>
                </tr>
              ) : (
                paginated.map(material => {
                  const stockLevel = getStockLevel(material.stock, material.lowStockThreshold);
                  const stockStyle = STOCK_STYLE[stockLevel];
                  return (
                    <tr key={material.id} className="hover:bg-slate-50/50 transition-colors text-slate-700">
                      
                      {/* Name + Label Metrics */}
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-slate-800">{material.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{material.id}</p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                          {material.category}
                        </span>
                      </td>

                      {/* Real-time Counter controls */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStockAdjust(material.id, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 font-bold transition-colors"
                          >-</button>
                          <span className="font-bold text-slate-800 min-w-12 text-center">
                            {material.stock} <span className="text-xs font-normal text-slate-400">{material.unit}</span>
                          </span>
                          <button
                            onClick={() => handleStockAdjust(material.id, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 font-bold transition-colors"
                          >+</button>
                        </div>
                      </td>

                      {/* Explicit raw bounds */}
                      <td className="py-3 px-4 font-medium text-slate-500">
                        &lt; {material.lowStockThreshold} {material.unit}
                      </td>

                      {/* Color Coded Health Badges */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${stockStyle.bg} ${stockStyle.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stockStyle.dot}`} />
                          {stockStyle.label}
                        </span>
                      </td>

                      {/* Audit Interaction Trail */}
                      <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                        {material.lastRestocked}
                      </td>

                      {/* CRUD Triggers */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(material)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Edit raw item attributes"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(material.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Purge raw material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Context Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} material item{filtered.length !== 1 ? "s" : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold ${
                      currentPage === p ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-500"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Container */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
            <div className="flex flex-col items-center text-center gap-3 p-6 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Material?</h3>
                <p className="text-sm text-slate-500 mt-1">This changes recipe scaling if this raw ingredient is mapping to active menu systems.</p>
              </div>
            </div>
            <div className="flex gap-3 p-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 font-medium text-sm py-2.5 rounded-lg"
              >Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 bg-red-500 text-white font-semibold text-sm py-2.5 rounded-lg"
              >Purge</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Structural Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative flex flex-col items-center p-6 bg-emerald-600 text-white">
              <Scale className="h-7 w-7 mb-1" />
              <h3 className="text-xl font-semibold">
                {editingMaterial ? "Edit Material Metric" : "Register Raw Ingredient"}
              </h3>
              <button onClick={closeModal} className="absolute right-6 top-6 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                
                {/* Name Attribute */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Ingredient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sugar, Milk, Coffee Beans"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Categories Wrapper mapping */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Warehouse Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Quantity + Unit metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Initial Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      value={form.stock}
                      onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit of Measurement</label>
                    <select
                      value={form.unit}
                      onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="L">Liters (L)</option>
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="g">Grams (g)</option>
                      <option value="bags">Bags</option>
                    </select>
                  </div>
                </div>

                {/* Structural Alert Constraints */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Low Stock Warning Threshold</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    required
                    value={form.lowStockThreshold}
                    onChange={e => setForm(p => ({ ...p, lowStockThreshold: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Form Processing Footer */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-600"
                  >Cancel</button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-medium text-white shadow-sm transition-colors"
                  >
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