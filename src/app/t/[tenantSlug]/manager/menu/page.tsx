"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, X, UtensilsCrossed, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  img: string;
}

interface FormDraft {
  name: string;
  categoryId: string;
  price: string;
  img: string;
}

const EMPTY_DRAFT: FormDraft = { name: "", categoryId: "", price: "", img: "" };

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");

  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FormDraft>(EMPTY_DRAFT);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    async function fetchCategories() {
      setIsLoadingCategories(true);
      setErrorMsg(null);
      try {
        const res = await api.get("/categories");
        setCategories(res.data.categories ?? []);
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.error ?? "Failed to load categories.");
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;

    if (activeCategoryId === "all") {
      setIsLoadingProducts(true);
      setErrorMsg(null);
      Promise.all(
        categories.map((cat) =>
          api
            .get(`/categories/${cat.id}/products`)
            .then((res) =>
              (res.data.products ?? []).map((p: any) => ({
                ...p,
                category: cat.name,
                categoryId: cat.id,
                img: p.imageUrl ?? p.image ?? p.img ?? "",
              }))
            )
            .catch(() => [])
        )
      )
        .then((results) => setMenuItems(results.flat()))
        .finally(() => setIsLoadingProducts(false));
      return;
    }

    async function fetchProducts() {
      setIsLoadingProducts(true);
      setErrorMsg(null);
      try {
        const res = await api.get(`/categories/${activeCategoryId}/products`);
        const cat = categories.find((c) => c.id === activeCategoryId);
        setMenuItems(
          (res.data.products ?? []).map((p: any) => ({
            ...p,
            category: cat?.name ?? "",
            categoryId: activeCategoryId,
            img: p.imageUrl ?? p.image ?? p.img ?? "",
          }))
        );
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.error ?? "Failed to load products.");
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [activeCategoryId, categories]);

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdd = () => {
    setEditingId(null);
    setDraft({ ...EMPTY_DRAFT, categoryId: categories[0]?.id ?? "" });
    setIsModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      categoryId: item.categoryId,
      price: String(item.price),
      img: item.img,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST /products or PATCH /products/:id
    closeModal();
  };

  const handleDeleteItem = async (id: string) => {
    // TODO: DELETE /products/:id
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <div className="flex flex-col gap-6 h-full">

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">Menu Editor</h1>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shrink-0">
          {errorMsg}
        </div>
      )}

      {/* Category Tabs + Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-full pb-1 w-full md:w-auto snap-x">
          {isLoadingCategories ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <>
              <button
                onClick={() => setActiveCategoryId("all")}
                className={`snap-start shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeCategoryId === "all"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`snap-start shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeCategoryId === cat.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {cat.name}
                </button>
              ))}

              {/* + Category button */}
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="snap-start shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-dashed border-emerald-300 text-emerald-600 text-xs font-semibold hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Category
              </button>
            </>
          )}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {isLoadingProducts ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 content-start pb-6">

            {/* Add placeholder card — always first */}
            <div
              onClick={openAdd}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group h-[240px]"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 group-hover:border-emerald-400 group-hover:bg-emerald-100 flex items-center justify-center transition-all">
                <Plus className="w-6 h-6 text-emerald-500 group-hover:text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500 group-hover:text-emerald-600 transition-colors">
                  Add New Item
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Click to add a menu item</p>
              </div>
            </div>

            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image — fixed height */}
                <div className="relative h-40 w-full shrink-0 bg-slate-100">
                  {item.img?.startsWith("http") ? (
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                      <UtensilsCrossed className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                  <span className="absolute left-3 bottom-3 bg-white text-emerald-700 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border border-emerald-100 shadow-sm">
                    {item.category}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-3 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{item.name}</h4>
                    <span className="text-sm font-bold text-emerald-600 shrink-0">
                      Rs.{Number(item.price).toFixed(2)}
                    </span>
                  </div>
                 <div className="flex gap-2">
  <button
    onClick={() => openEdit(item)}
    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 hover:bg-emerald-600 text-slate-500 hover:text-white text-xs font-semibold transition-colors"
  >
    <Pencil className="w-3 h-3" /> Edit
  </button>
  <button
    onClick={() => setDeleteConfirmId(item.id)}
    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 hover:bg-red-500 text-slate-500 hover:text-white text-xs font-semibold transition-colors"
  >
    <Trash2 className="w-3 h-3" /> Delete
  </button>
</div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 text-sm">
                No items found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 p-6 border-b border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Item?</h3>
                <p className="text-sm text-slate-500">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 p-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-sm py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirmId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white border border-slate-200 w-full max-w-lg rounded-xl shadow-xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Green Modal Header */}
            <div className="relative flex items-center justify-center p-6 bg-emerald-600 rounded-t-xl">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center">
                  <UtensilsCrossed className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white">
                  {editingId ? "Edit Item" : "Add New Item"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="absolute right-6 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Item Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Iced Matcha"
                      value={draft.name}
                      onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Category
                    </label>
                    <select
                      value={draft.categoryId}
                      onChange={(e) => setDraft((p) => ({ ...p, categoryId: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Price (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 250"
                    value={draft.price}
                    onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Image URL{" "}
                    <span className="normal-case text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={draft.img}
                    onChange={(e) => setDraft((p) => ({ ...p, img: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-medium text-white shadow-sm transition-colors"
                  >
                    {editingId ? "Save Changes" : "Add Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
            <div className="relative flex items-center justify-center p-6 bg-emerald-600 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">Add New Category</h3>
              <button
                onClick={() => { setCategoryModalOpen(false); setNewCategory(""); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smoothies"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setCategoryModalOpen(false); setNewCategory(""); }}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newCategory.trim()) return;
                 
                    setCategoryModalOpen(false);
                    setNewCategory("");
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-medium text-white shadow-sm transition-colors"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}