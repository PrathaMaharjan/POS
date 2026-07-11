"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus, Search, Pencil, Trash2, X,
  UtensilsCrossed, Loader2, Settings2, ImagePlus, Ruler
} from "lucide-react";
import api from "@/lib/api";
import { useImageUpload } from "@/lib/hooks/useImageUpload";

interface Category {
  id: string;
  name: string;
}

interface ProductSize {
  id?: string;
  label: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  imageUrl: string | null;
  description?: string | null;
  isAvailable?: boolean;
  sizes?: ProductSize[];
}

interface SizeDraft {
  id?: string;
  label: string;
  price: string;
}

interface FormDraft {
  name: string;
  categoryId: string;
  price: string;
  description: string;
  hasSizes: boolean;
  sizes: SizeDraft[];
}

const EMPTY_DRAFT: FormDraft = {
  name: "",
  categoryId: "",
  price: "",
  description: "",
  hasSizes: false,
  sizes: [{ label: "", price: "" }, { label: "", price: "" }],
};

// ── Variants API helper ──────────────────────────────────────────────
async function fetchVariants(productId: string): Promise<ProductSize[]> {
  try {
    const res = await api.get(`/product/${productId}/variants`);
    const variants = res.data.variants ?? [];
    return variants.map((v: any) => ({
      id: v.id,
      label: v.label,
      price: Number(v.price),
    }));
  } catch {
    return [];
  }
}

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
  const [originalSizes, setOriginalSizes] = useState<ProductSize[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Image upload state
  const { uploadImage, uploading, error: uploadError } = useImageUpload();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // Category states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryManageMode, setCategoryManageMode] = useState(false);

  // Fetch categories
  async function fetchCategories() {
    setIsLoadingCategories(true);
    setErrorMsg(null);
    try {
      const res = await api.get("/categories");
      setCategories(res.data.categories ?? res.data ?? []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error ?? "Failed to load categories.");
    } finally {
      setIsLoadingCategories(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    if (categories.length === 0) {
      setMenuItems([]);
      return;
    }

    if (activeCategoryId === "all") {
      setIsLoadingProducts(true);
      Promise.all(
        categories.map((cat) =>
          api
            .get(`/categories/${cat.id}/products`)
            .then(async (res) => {
              const products = res.data.products ?? res.data ?? [];
              return Promise.all(
                products.map(async (p: any) => {
                  const sizes = await fetchVariants(p.id);
                  return {
                    ...p,
                    category: cat.name,
                    categoryId: cat.id,
                    imageUrl: p.imageUrl ?? null,
                    sizes: sizes.length > 0 ? sizes : undefined,
                  };
                })
              );
            })
            .catch(() => [])
        )
      )
        .then((results) => setMenuItems(results.flat()))
        .finally(() => setIsLoadingProducts(false));
      return;
    }

    async function fetchProducts() {
      setIsLoadingProducts(true);
      try {
        const res = await api.get(`/product?categoryId=${activeCategoryId}`);
        const cat = categories.find((c) => c.id === activeCategoryId);
        const data = res.data.products;
        const productsList = Array.isArray(data) ? data : (data?.products ?? []);

        const withSizes = await Promise.all(
          productsList.map(async (p: any) => {
            const sizes = await fetchVariants(p.id);
            return {
              ...p,
              category: cat?.name ?? "",
              categoryId: activeCategoryId,
              imageUrl: p.imageUrl ?? null,
              sizes: sizes.length > 0 ? sizes : undefined,
            };
          })
        );

        setMenuItems(withSizes);
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.error ?? "Failed to load products.");
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [activeCategoryId, categories, refreshKey]);

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

  // ── Size row helpers ─────────────────────────────────────────────────
  function updateSizeRow(index: number, field: keyof SizeDraft, value: string) {
    setDraft((p) => ({
      ...p,
      sizes: p.sizes.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  }

  function addSizeRow() {
    setDraft((p) => ({ ...p, sizes: [...p.sizes, { label: "", price: "" }] }));
  }

  function removeSizeRow(index: number) {
    setDraft((p) => ({ ...p, sizes: p.sizes.filter((_, i) => i !== index) }));
  }

  const openAdd = () => {
    setEditingId(null);
    setDraft({ ...EMPTY_DRAFT, categoryId: categories[0]?.id ?? "", sizes: [{ label: "", price: "" }, { label: "", price: "" }] });
    setOriginalSizes([]);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingId(item.id);
    const hasSizes = !!item.sizes && item.sizes.length > 1;
    setDraft({
      name: item.name,
      categoryId: item.categoryId,
      price: String(item.price),
      description: item.description ?? "",
      hasSizes,
      sizes: hasSizes
        ? item.sizes!.map((s) => ({ id: s.id, label: s.label, price: String(s.price) }))
        : [{ label: "", price: "" }, { label: "", price: "" }],
    });
    setOriginalSizes(item.sizes ?? []);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(item.imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setOriginalSizes([]);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  };

  // ── Sync variants against the backend ───────────────────────────────
  async function syncVariants(
    productId: string,
    original: ProductSize[],
    updated: ProductSize[]
  ) {
    const updatedIds = new Set(updated.map((s) => s.id).filter(Boolean));

    // Delete variants that were removed
    const toDelete = original.filter((s) => s.id && !updatedIds.has(s.id));
    await Promise.all(
      toDelete.map((s) => api.delete(`/product/${productId}/variants/${s.id}`))
    );

    // Create new / update changed variants
    for (const size of updated) {
      if (size.id) {
        const before = original.find((o) => o.id === size.id);
        if (before && (before.label !== size.label || before.price !== size.price)) {
          await api.patch(`/product/${productId}/variants/${size.id}`, {
            label: size.label,
            price: size.price.toFixed(2),
          });
        }
      } else {
        await api.post(`/product/${productId}/variants`, {
          label: size.label,
          price: size.price.toFixed(2),
        });
      }
    }
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate sizes if the toggle is on: need at least 2 complete rows
    let validSizes: ProductSize[] = [];
    if (draft.hasSizes) {
      validSizes = draft.sizes
        .filter((s) => s.label.trim() && s.price.trim())
        .map((s) => ({ id: s.id, label: s.label.trim(), price: Number(s.price) }));
      if (validSizes.length < 2) {
        setErrorMsg("Add at least 2 sizes with a label and price, or turn off multiple sizes.");
        return;
      }
    }

    setIsSaving(true);

    try {
      let imagePublicId: string | undefined = undefined;

      if (imageFile) {
        const result = await uploadImage(imageFile);
        if (!result) {
          setIsSaving(false);
          return;
        }
        imagePublicId = result.publicId;
      }

      const basePrice = draft.hasSizes
        ? Math.min(...validSizes.map((s) => s.price))
        : Number(draft.price);

      let savedId = editingId;

      if (editingId) {
        await api.patch(`/product/${editingId}`, {
          name: draft.name,
          categoryId: draft.categoryId,
          price: basePrice,
          description: draft.description || undefined,
          ...(imagePublicId && { imagePublicId }),
        });
      } else {
        const res = await api.post("/product", {
          name: draft.name,
          categoryId: draft.categoryId,
          price: basePrice,
          description: draft.description || undefined,
          imagePublicId: imagePublicId ?? undefined,
        });
        savedId = typeof res.data === 'string' ? res.data : (res.data?.product?.id ?? res.data?.id ?? null);
      }

      // Sync size/variant rows against the backend
      if (savedId) {
        if (draft.hasSizes) {
          await syncVariants(savedId, originalSizes, validSizes);
        } else if (originalSizes.length > 0) {
          await Promise.all(
            originalSizes
              .filter((s) => s.id)
              .map((s) => api.delete(`/product/${savedId}/variants/${s.id}`))
          );
        }
      }

      setRefreshKey(prev => prev + 1);
      closeModal();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error ?? "Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      setIsDeleting(true);
      await api.delete(`/product/${id}`);
      setRefreshKey(prev => prev + 1);
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
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
        await api.patch(`/categories/${editingCategory.id}`, { name: newCategoryName.trim() });
      } else {
        await api.post("/categories", { name: newCategoryName.trim() });
      }
      await fetchCategories();
      setCategoryModalOpen(false);
      setNewCategoryName("");
      setEditingCategory(null);
    } catch (err: any) {
      const serverErr = err?.response?.data?.error;
      setErrorMsg(
        typeof serverErr === "object"
          ? JSON.stringify(serverErr)
          : serverErr ?? "Failed to save category."
      );
    }
  };

  const handleDeleteCategory = async (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this category?")) return;
    setErrorMsg(null);
    try {
      await api.delete(`/categories/${catId}`);
      if (activeCategoryId === catId) setActiveCategoryId("all");
      await fetchCategories();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error ?? "Failed to delete category.");
    }
  };

  const modalImageSrc = imagePreview ?? existingImageUrl;

  return (
    <div className="flex flex-col gap-4 md:gap-6 h-full p-4 md:p-0">
      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-4 py-4 md:px-6 md:py-5 text-white shadow-sm shrink-0">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Menu Editor</h1>
      </div>

      {(errorMsg || uploadError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shrink-0 flex justify-between items-center gap-2">
          <span className="truncate max-w-[90%]">{errorMsg ?? uploadError}</span>
          <button onClick={() => setErrorMsg(null)} className="shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Category Tabs + Search Framework */}
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

      {/* Product Grid Layout updates */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {isLoadingProducts ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 content-start pb-6">
            <div
              onClick={openAdd}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group h-[320px] md:h-[320px]"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 group-hover:border-emerald-400 flex items-center justify-center transition-all">
                <Plus className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              </div>
              <div className="text-center px-4">
                <p className="text-sm font-semibold text-slate-500 group-hover:text-emerald-600">Add New Item</p>
                <p className="text-xs text-slate-400 mt-0.5">Click to add a menu item</p>
              </div>
            </div>

            {filteredItems.map((item) => {
              const hasMultipleSizes = !!item.sizes && item.sizes.length > 1;
              const displayPrice = hasMultipleSizes
                ? Math.min(...item.sizes!.map((s) => s.price))
                : Number(item.price);
              return (
                <div key={item.id} className={`bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow ${!item.isAvailable ? "opacity-75" : ""}`}>
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
                    {hasMultipleSizes && (
                      <span className="absolute right-3 bottom-3 flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md shadow-sm z-10">
                        <Ruler className="w-2.5 h-2.5" /> {item.sizes!.length} sizes
                      </span>
                    )}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1.5px] z-20 animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(15, 15, 17, 0.7)' }}>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-neutral-200 bg-neutral-800/90 border border-neutral-700/50 shadow-sm">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col gap-2.5 flex-1 justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 break-words">{item.name}</h4>
                        {hasMultipleSizes ? (
                          <div className="flex flex-col gap-0.5 shrink-0 whitespace-nowrap">
                            {item.sizes!.map((s) => (
                              <div key={s.id} className="flex justify-end gap-2 text-xs">
                                <span className="text-slate-500">{s.label}:</span>
                                <span className="font-bold text-emerald-600">Rs.{s.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-emerald-600 shrink-0 whitespace-nowrap">
                            Rs.{displayPrice.toFixed(2)}
                          </span>
                        )}
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
              );
            })}

            {filteredItems.length === 0 && !isLoadingProducts && (
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
                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 font-medium text-sm py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
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

                {/* Multiple sizes toggle */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-3 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">This item has multiple sizes</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, hasSizes: !p.hasSizes }))}
                    className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${draft.hasSizes ? "bg-emerald-600" : "bg-slate-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${draft.hasSizes ? "translate-x-4" : ""}`}
                    />
                  </button>
                </div>

                {draft.hasSizes ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Sizes &amp; Prices</label>
                    {draft.sizes.map((size, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 500ML"
                          value={size.label}
                          onChange={(e) => updateSizeRow(idx, "label", e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          step="1"
                          placeholder="Price"
                          value={size.price}
                          onChange={(e) => updateSizeRow(idx, "price", e.target.value)}
                          className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeSizeRow(idx)}
                          disabled={draft.sizes.length <= 1}
                          className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSizeRow}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add another size
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Price (Rs.)</label>
                    <input
                      type="number" step="1" required placeholder="e.g. 250"
                      value={draft.price}
                      onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

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

                {/* Image Upload Area */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Product Image
                  </label>

                  {modalImageSrc ? (
                    <div className="relative w-full h-36 md:h-40 rounded-lg overflow-hidden border border-slate-200">
                      <Image
                        src={modalImageSrc}
                        alt="Preview"
                        fill
                        sizes="(max-width: 500px) 100vw, 500px"
                        className="object-cover"
                        unoptimized={modalImageSrc.startsWith('blob:')}
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition-colors z-10"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1.5 w-full h-36 md:h-40 rounded-lg border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-colors px-4 text-center">
                      <ImagePlus className="w-7 h-7 text-slate-300" />
                      <span className="text-xs text-slate-400 font-medium">Click to upload image</span>
                      <span className="text-[10px] text-slate-300">JPG, PNG, WebP — max 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
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
                  <button
                    type="button" onClick={closeModal}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || uploading}
                    className="flex-1 rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-medium shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving || uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
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

      {/* Category Save Modal */}
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