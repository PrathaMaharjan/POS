"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus, Search, Pencil, Trash2, X,
  UtensilsCrossed, Loader2, Settings2, ImagePlus, Store, ChevronDown
} from "lucide-react";
import api from "@/lib/api";
import { useImageUpload } from "@/lib/hooks/useImageUpload";

interface Category {
  id: string;
  name: string;
}

interface Outlet {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  imageUrl: string | null;
  description?: string | null;
}

interface FormDraft {
  name: string;
  categoryId: string;
  price: string;
  description: string;
}

const EMPTY_DRAFT: FormDraft = {
  name: "",
  categoryId: "",
  price: "",
  description: "",
};

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");

  // ── Outlet state ────────────────────────────────────────────────────────
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeOutletId, setActiveOutletId] = useState<string>("");
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);

  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FormDraft>(EMPTY_DRAFT);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { uploadImage, uploading, error: uploadError } = useImageUpload();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryManageMode, setCategoryManageMode] = useState(false);

  const activeOutlet = outlets.find((o) => o.id === activeOutletId);

  // 1. Fetch Outlets on mount
  useEffect(() => {
    async function initOutlets() {
      try {
        const res = await api.get("/outlets");
        const list = res.data.outlets ?? [];
        setOutlets(list);
        
        // Try to read from localStorage first
        const stored = localStorage.getItem("activeOutletId");
        if (stored && list.some((o: any) => o.id === stored)) {
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

  // 2. Fetch categories when activeOutletId changes
  useEffect(() => {
    if (!activeOutletId) return;

    localStorage.setItem("activeOutletId", activeOutletId);

    async function loadCategories() {
      setIsLoadingCategories(true);
      setErrorMsg(null);
      try {
        const res = await api.get(`/categories?outletId=${activeOutletId}`);
        const cats = res.data.categories ?? res.data ?? [];
        setCategories(cats);
        // Reset category filter when switching outlets
        setActiveCategoryId("all");
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.error ?? "Failed to load categories.");
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, [activeOutletId, refreshKey]);

  // 3. Fetch products when activeOutletId, activeCategoryId, categories or refreshKey changes
  useEffect(() => {
    if (!activeOutletId || categories.length === 0) {
      setMenuItems([]);
      return;
    }

    async function fetchProducts() {
      setIsLoadingProducts(true);
      setErrorMsg(null);
      try {
        let url = `/product?outletId=${activeOutletId}&limit=100`;
        if (activeCategoryId !== "all") {
          url += `&categoryId=${activeCategoryId}`;
        }
        const res = await api.get(url);
        const productsList = res.data.products?.products ?? res.data.products ?? [];
        setMenuItems(
          productsList.map((p: any) => {
            const cat = categories.find((c) => c.id === p.categoryId);
            return {
              id: p.id,
              name: p.name,
              category: cat?.name ?? "Uncategorized",
              categoryId: p.categoryId,
              price: Number(p.price),
              imageUrl: p.imageUrl ?? null,
              description: p.description ?? null,
            };
          })
        );
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.error ?? "Failed to load products.");
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [activeOutletId, activeCategoryId, categories, refreshKey]);

  // Close outlet dropdown when clicking outside
  useEffect(() => {
    if (!outletDropdownOpen) return;
    const handler = () => setOutletDropdownOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [outletDropdownOpen]);

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  }

  const openAdd = () => {
    setEditingId(null);
    setDraft({ ...EMPTY_DRAFT, categoryId: categories[0]?.id ?? "" });
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      categoryId: item.categoryId,
      price: String(item.price),
      description: item.description ?? "",
    });
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(item.imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    try {
      let imagePublicId: string | undefined = undefined;
      if (imageFile) {
        const result = await uploadImage(imageFile);
        if (!result) { setIsSaving(false); return; }
        imagePublicId = result.publicId;
      }
      if (editingId) {
        await api.patch(`/product/${editingId}`, {
          name: draft.name,
          categoryId: draft.categoryId,
          price: Number(draft.price),
          description: draft.description || undefined,
          outletId: activeOutletId,
          ...(imagePublicId && { imagePublicId }),
        });
      } else {
        await api.post("/product", {
          name: draft.name,
          categoryId: draft.categoryId,
          price: Number(draft.price),
          description: draft.description || undefined,
          outletId: activeOutletId,
          imagePublicId: imagePublicId ?? undefined,
        });
      }
      setRefreshKey((prev) => prev + 1);
      closeModal();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error ?? "Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`/product/${id}?outletId=${activeOutletId}`);
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error ?? "Failed to delete product.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setNewCategoryName("");
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setErrorMsg(null);
    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, {
          name: newCategoryName.trim(),
          outletId: activeOutletId,
        });
      } else {
        await api.post("/categories", {
          name: newCategoryName.trim(),
          outletId: activeOutletId,
        });
      }
      setRefreshKey((prev) => prev + 1);
      setCategoryModalOpen(false);
      setNewCategoryName("");
      setEditingCategory(null);
    } catch (err: any) {
      const serverErr = err?.response?.data?.error;
      setErrorMsg(
        typeof serverErr === "object" ? JSON.stringify(serverErr) : serverErr ?? "Failed to save category."
      );
    }
  };

  const handleDeleteCategory = async (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this category?")) return;
    setErrorMsg(null);
    try {
      await api.delete(`/categories/${catId}?outletId=${activeOutletId}`);
      if (activeCategoryId === catId) setActiveCategoryId("all");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error ?? "Failed to delete category.");
    }
  };

  const modalImageSrc = imagePreview ?? existingImageUrl;

  return (
    <div className="flex flex-col gap-4 md:gap-6 h-full p-4 md:p-0">
      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-4 py-4 md:px-6 md:py-5 text-white shadow-sm shrink-0 flex items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Menu Editor</h1>

        {/* ── Outlet picker ── */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOutletDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border bg-white text-emerald-700 border-white shadow-sm"
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Outlet</p>
              </div>
              <div className="py-1">
                {outlets.map((outlet) => (
                  <button
                    key={outlet.id}
                    onClick={() => { setActiveOutletId(outlet.id); setOutletDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${activeOutletId === outlet.id
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${activeOutletId === outlet.id ? "bg-emerald-500" : "bg-slate-200"}`} />
                    {outlet.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {(errorMsg || uploadError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shrink-0 flex justify-between items-center gap-2">
          <span className="truncate max-w-[90%]">{errorMsg ?? uploadError}</span>
          <button onClick={() => setErrorMsg(null)} className="shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Category Tabs + Search */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 xl:pb-0 w-full xl:max-w-[calc(100%-17rem)] snap-x">
          {isLoadingCategories ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <>
              <button
                onClick={() => setActiveCategoryId("all")}
                className={`snap-start shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${activeCategoryId === "all"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
              >
                All Items
              </button>

              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`snap-start shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${activeCategoryId === cat.id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  <button onClick={() => setActiveCategoryId(cat.id)} className="focus:outline-none">
                    {cat.name}
                  </button>
                  {categoryManageMode && (
                    <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-current opacity-80">
                      <button onClick={(e) => handleOpenEditCategory(cat, e)} className="hover:scale-110 p-0.5 transition-transform">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => handleDeleteCategory(cat.id, e)} className="hover:scale-110 p-0.5 text-red-400 hover:text-red-200 transition-transform">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleOpenAddCategory}
                className="snap-start shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-dashed border-emerald-300 text-emerald-600 text-xs font-semibold hover:bg-emerald-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Category
              </button>

              <button
                onClick={() => setCategoryManageMode(!categoryManageMode)}
                className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${categoryManageMode
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{categoryManageMode ? "Exit Config" : "Edit Categories"}</span>
              </button>
            </>
          )}
        </div>

        <div className="relative w-full xl:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {isLoadingProducts ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 content-start pb-6">
            <div
              onClick={openAdd}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group h-[220px] md:h-[240px]"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 group-hover:border-emerald-400 flex items-center justify-center transition-all">
                <Plus className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              </div>
              <div className="text-center px-4">
                <p className="text-sm font-semibold text-slate-500 group-hover:text-emerald-600">Add New Item</p>
                <p className="text-xs text-slate-400 mt-0.5">Click to add a menu item</p>
              </div>
            </div>

            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-36 md:h-40 w-full shrink-0 bg-slate-100">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                      priority={filteredItems.indexOf(item) < 4}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                      <UtensilsCrossed className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                  <span className="absolute left-3 bottom-3 bg-white text-emerald-700 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border border-emerald-100 shadow-sm z-10">
                    {item.category}
                  </span>
                </div>

                <div className="p-3 flex flex-col gap-2.5 flex-1 justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 break-words">{item.name}</h4>
                      <span className="text-sm font-bold text-emerald-600 shrink-0 whitespace-nowrap">Rs.{Number(item.price).toFixed(2)}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 break-words mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 hover:bg-emerald-600 text-slate-500 hover:text-white text-xs font-semibold transition-colors">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => setDeleteConfirmId(item.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 hover:bg-red-500 text-slate-500 hover:text-white text-xs font-semibold transition-colors">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && !isLoadingProducts && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 text-sm gap-2">
                <Store className="w-8 h-8 text-slate-200" />
                {`No items found for ${activeOutlet?.name ?? "this outlet"}.`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 p-5 md:p-6 border-b border-slate-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Item?</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 p-5 md:p-6">
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                disabled={isDeleting}
                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteItem(deleteConfirmId)} 
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closeModal}>
          <div
            className="bg-white border border-slate-200 w-full sm:max-w-md md:max-w-lg rounded-t-2xl sm:rounded-xl shadow-xl overflow-y-auto max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center py-5 px-6 bg-emerald-600">
              <div className="flex flex-col items-center text-center">
                <UtensilsCrossed className="h-6 w-6 text-white mb-1" />
                <h3 className="text-xl font-semibold text-white">
                  {editingId ? "Edit Item" : "Add New Item"}
                </h3>
              </div>
              <button onClick={closeModal} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 md:p-6">
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Item Name</label>
                    <input
                      type="text" required placeholder="e.g. Iced Matcha"
                      value={draft.name}
                      onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</label>
                    <select
                      value={draft.categoryId}
                      onChange={(e) => setDraft((p) => ({ ...p, categoryId: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Price (Rs.)</label>
                  <input
                    type="number" step="0.01" required placeholder="e.g. 250"
                    value={draft.price}
                    onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Description (optional)</label>
                  <textarea
                    placeholder="Short description..."
                    value={draft.description}
                    onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Product Image</label>
                  {modalImageSrc ? (
                    <div className="relative w-full h-36 md:h-40 rounded-lg overflow-hidden border border-slate-200">
                      <Image
                        src={modalImageSrc}
                        alt="Preview"
                        fill
                        sizes="(max-width: 500px) 100vw, 500px"
                        className="object-cover"
                        unoptimized={modalImageSrc.startsWith("blob:")}
                      />
                      <button type="button" onClick={clearImage} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition-colors z-10">
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1.5 w-full h-36 md:h-40 rounded-lg border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-colors px-4 text-center">
                      <ImagePlus className="w-7 h-7 text-slate-300" />
                      <span className="text-xs text-slate-400 font-medium">Click to upload image</span>
                      <span className="text-[10px] text-slate-300">JPG, PNG, WebP — max 5MB</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading to Cloudinary...
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100 pb-4 sm:pb-0">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-600">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || uploading}
                    className="flex-1 rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-medium shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving || uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                    ) : (
                      <span>{editingId ? "Save Changes" : "Add Item"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-slate-200 w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-150">
            <div className="relative flex items-center justify-center py-4 px-6 bg-emerald-600">
              <h3 className="text-base font-semibold text-white">
                {editingCategory ? "Rename Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => { setCategoryModalOpen(false); setNewCategoryName(""); setEditingCategory(null); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Category Name</label>
                <input
                  type="text" placeholder="e.g. Smoothies"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100 pb-4 sm:pb-0">
                <button
                  onClick={() => { setCategoryModalOpen(false); setNewCategoryName(""); setEditingCategory(null); }}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="flex-1 rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-medium hover:bg-emerald-700"
                >
                  {editingCategory ? "Save Changes" : "Add Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}