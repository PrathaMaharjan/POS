"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  BookOpen,
  Utensils,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import api from "@/lib/api";

interface ProductSize {
  id: string;
  label: string;
  price: number;
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  sizes?: ProductSize[];
}

interface StockItem {
  id: string;
  name: string;
  unit: "g" | "kg" | "ml" | "L" | "pieces";
  currentStock: number;
}

interface RecipeItem {
  id: string;
  stockItemId: string;
  stockItemName: string;
  unit: string;
  quantity: number;
}

interface Recipe {
  recipeId: string;
  productId: string;
  productName: string;
  outletId: string;
  items: RecipeItem[];
}

interface RecipeItemDraft {
  stockItemId: string;
  quantity: string;
}

export default function RecipeManagementPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string; }>();


  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [recipesMap, setRecipesMap] = useState<Record<string, Recipe | null>>({});

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "configured" | "not_configured">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [formItems, setFormItems] = useState<RecipeItemDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Deletion state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch initial data: products, inventory items, and recipes
  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, inventoryRes] = await Promise.all([
        api.get("/product?limit=100"),
        api.get("/inventory"),
      ]);

      const rawProducts = productsRes.data.products;
      const loadedProducts = Array.isArray(rawProducts)
        ? rawProducts
        : (rawProducts?.products ?? []);
      const withSizes = await Promise.all(
        loadedProducts.map(async (p: any) => {
          const sizes = await fetchVariants(p.id);
          return {
            ...p,
            price: Number(p.price),
            sizes: sizes.length > 0 ? sizes : undefined,
          };
        })
      );
      setProducts(withSizes);

      const loadedStock = inventoryRes.data.stockItems ?? [];
      setStockItems(loadedStock);

      if (withSizes.length > 0) {
        const recipePromises = withSizes.flatMap((p: Product) => {
          if (p.sizes) {
            return p.sizes.map(async (size) => {
              try {
                const recipeRes = await api.get(`/recipe/${p.id}?variantId=${size.id}`);
                return { key: `${p.id}-${size.id}`, recipe: recipeRes.data.recipe };
              } catch (err) {
                return { key: `${p.id}-${size.id}`, recipe: null };
              }
            });
          } else {
            return [
              (async () => {
                try {
                  const recipeRes = await api.get(`/recipe/${p.id}`);
                  return { key: p.id, recipe: recipeRes.data.recipe };
                } catch (err) {
                  return { key: p.id, recipe: null };
                }
              })(),
            ];
          }
        });

        const recipeResults = await Promise.all(recipePromises);
        const map: Record<string, Recipe | null> = {};
        recipeResults.forEach((res) => {
          map[res.key] = res.recipe;
        });
        setRecipesMap(map);
      }
    } catch (err: any) {
      console.error("Dashboard load failed:", err);
      setError(err?.response?.data?.error ?? "Failed to fetch required data from API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const filteredProducts = useMemo(() => {
    const rows = products.flatMap((p) => {
      if (p.sizes) {
        return p.sizes.map((s) => ({
          key: `${p.id}-${s.id}`,
          product: p,
          variantId: s.id,
          name: `${p.name} (${s.label})`,
          price: s.price,
        }));
      }
      return [
        {
          key: p.id,
          product: p,
          variantId: undefined as string | undefined,
          name: p.name,
          price: p.price,
        },
      ];
    });

    return rows.filter((row) => {
      const matchesSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const hasRecipe = recipesMap[row.key] !== undefined && recipesMap[row.key] !== null;
      if (filterType === "configured") return hasRecipe;
      if (filterType === "not_configured") return !hasRecipe;
      return true;
    });
  }, [products, searchQuery, filterType, recipesMap]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredProducts, currentPage]);

  const openRecipeModal = (rowKey: string) => {
    setSelectedRowKey(rowKey);
    const existingRecipe = recipesMap[rowKey];

    if (existingRecipe) {
      setFormItems(
        existingRecipe.items.map((item) => ({
          stockItemId: item.stockItemId,
          quantity: String(item.quantity),
        }))
      );
    } else {
      setFormItems([{ stockItemId: "", quantity: "" }]);
    }

    setSaveError(null);
    setIsModalOpen(true);
  };

  const closeRecipeModal = () => {
    setIsModalOpen(false);
    setSelectedRowKey(null);
    setFormItems([]);
    setSaveError(null);
  };

  const hasExistingRecipe = React.useMemo(() => {
    if (!selectedRowKey) return false;
    return recipesMap[selectedRowKey] !== undefined && recipesMap[selectedRowKey] !== null;
  }, [recipesMap, selectedRowKey]);


  function handleAddIngredientRow() {
    setFormItems([...formItems, { stockItemId: "", quantity: "" }]);
  }

  function handleRemoveIngredientRow(index: number) {
    const updated = [...formItems];
    updated.splice(index, 1);
    setFormItems(updated);
  }

  function handleFormItemChange(index: number, field: keyof RecipeItemDraft, value: string) {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
    setSaveError(null);
  }

 
  async function handleSaveRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRowKey) return;

    setSaveError(null);

    // Validate rows
    const cleanedItems = formItems.filter((i) => i.stockItemId || i.quantity);
    if (cleanedItems.length === 0) {
      setSaveError("Recipe must have at least one ingredient configuration.");
      return;
    }

    const hasInvalidItem = cleanedItems.some(
      (item) => !item.stockItemId || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0
    );

    if (hasInvalidItem) {
      setSaveError("Ensure all ingredients are selected and have a valid quantity greater than 0.");
      return;
    }

    const productId = selectedRowKey.substring(0, 36);
    const variantId = selectedRowKey.length > 36 ? selectedRowKey.substring(37) : undefined;

    const payload: any = {
      items: cleanedItems.map((item) => ({
        stockItemId: item.stockItemId,
        quantity: Number(item.quantity),
      })),
    };

    if (variantId) {
      payload.variantId = variantId;
    }

    setSaving(true);
    try {
      const variantQuery = variantId ? `?variantId=${variantId}` : '';

      let res;
      if (hasExistingRecipe) {
        res = await api.patch(`/recipe/${productId}${variantQuery}`, payload);
      } else {
        res = await api.post(`/recipe/${productId}${variantQuery}`, payload);
      }


      setRecipesMap((prev) => ({
        ...prev,
        [selectedRowKey]: res.data,
      }));

      closeRecipeModal();
    } catch (err: any) {
      console.error("Save recipe failed:", err);
      let errMsg = "Failed to save product recipe.";
      if (err?.response?.data?.error) {
         const apiErr = err.response.data.error;
         if (typeof apiErr === "string") {
            errMsg = apiErr;
         } else if (typeof apiErr === "object") {
            errMsg = (apiErr.formErrors?.[0] as string) || (Object.values(apiErr.fieldErrors || {}).flat()[0] as string) || "Validation error: Please check your input.";
         }
      }
      setSaveError(errMsg);
    } finally {
      setSaving(false);
    }
  }


  async function handleDeleteRecipe() {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const productId = deleteConfirmId.substring(0, 36);
      const variantId = deleteConfirmId.length > 36 ? deleteConfirmId.substring(37) : undefined;
      const variantQuery = variantId ? `?variantId=${variantId}` : '';

      await api.delete(`/recipe/${productId}${variantQuery}`);
      setRecipesMap((prev) => {
        const copy = { ...prev };
        delete copy[deleteConfirmId];
        return copy;
      });
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error("Delete recipe failed:", err);
      alert(err?.response?.data?.error ?? "Failed to delete recipe.");
    } finally {
      setDeleting(false);
    }
  }

  function triggerDeleteFromModal() {
    if (!selectedRowKey) return;
    const key = selectedRowKey;
    closeRecipeModal();
    setDeleteConfirmId(key);
  }

  function getStockUnit(stockItemId: string): string {
    const item = stockItems.find((s) => s.id === stockItemId);
    return item ? item.unit : "";
  }


  function getAvailableStockItems(currentIndex: number) {
    const selectedIds = formItems
      .map((item, idx) => (idx !== currentIndex ? item.stockItemId : ""))
      .filter(Boolean);
    return stockItems.filter((item) => !selectedIds.includes(item.id));
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm font-medium animate-pulse">Loading menu items and ingredients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center max-w-2xl mx-auto my-10">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-red-800">Connection Error</h3>
        <p className="text-sm text-red-600 mt-1 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-0">
      {/* Premium Green Header Banner */}
      <div className="rounded-xl bg-emerald-600 px-4 py-4 md:px-6 md:py-5 text-white shadow-sm shrink-0">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Recipe Book</h1>
      </div>

      {stockItems.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 flex items-start gap-4 shrink-0">
          <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 text-sm">No Stock Items Available</h3>
            <p className="text-xs text-amber-600 mt-1">
              You must register stock ingredients (like sugar, flour, milk, etc.) in the Inventory module before you can map them to menu recipes.
            </p>
          </div>
        </div>
      )}

    
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
          {([
            { id: "all", label: "All Products" },
            { id: "configured", label: "Configured" },
            { id: "not_configured", label: "Needs Recipe" }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterType(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${filterType === tab.id
                  ? "bg-[#0f6b4a] text-white border-[#0f6b4a]"
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Box */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto whitespace-nowrap lg:whitespace-normal">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Product Name</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Ingredients Mapped</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-sm text-slate-400">
                    {products.length === 0
                      ? "No products recorded in menu yet."
                      : "No products match criteria."}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((row: any) => {
                  const recipe = recipesMap[row.key];
                  const hasRecipe = recipe !== undefined && recipe !== null;

                  return (
                    <tr
                      key={row.key}
                      onClick={() => openRecipeModal(row.key)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {row.name}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600">
                        Rs. {row.price.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-500">
                        {hasRecipe
                          ? `${recipe.items.length} ingredient${recipe.items.length !== 1 ? "s" : ""
                          }`
                          : "None"}
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openRecipeModal(row.key)}
                            title="Configure Recipe"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {hasRecipe && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(row.key);
                              }}
                              title="Delete Recipe"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <div className="text-sm text-slate-500 order-2 sm:order-1" />
          <div className="flex items-center gap-6 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Next Page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedRowKey && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeRecipeModal}
        >
          <div
            className="bg-white border border-slate-200 w-full sm:max-w-md md:max-w-xl rounded-t-2xl sm:rounded-xl shadow-xl overflow-y-auto max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="relative flex items-center justify-center py-5 px-6 bg-emerald-600">
              <div className="flex flex-col items-center text-center">
                <BookOpen className="h-6 w-6 text-white mb-1" />
                <h3 className="text-xl font-semibold text-white">
                  {paginatedProducts.find((r: any) => r.key === selectedRowKey)?.name || "Recipe"}
                </h3>

              </div>
              <button
                onClick={closeRecipeModal}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Worksheet Form */}
            <div className="p-5 md:p-6">
              <form onSubmit={handleSaveRecipe} className="space-y-5">
                {saveError && (
                  <div className="rounded-lg bg-red-50 border border-red-100 p-3 flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{saveError}</span>
                  </div>
                )}

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    <div className="col-span-7">Ingredient (Raw Item)</div>
                    <div className="col-span-4">Qty Required</div>
                    <div className="col-span-1" />
                  </div>

                  {formItems.map((item, index) => {
                    const selectedItem = stockItems.find((s) => s.id === item.stockItemId);
                    const unit = selectedItem ? selectedItem.unit : "";
                    const availableItems = getAvailableStockItems(index);

                    return (
                      <div key={index} className="grid grid-cols-12 gap-3 items-center">
                        {/* Dropdown component selection */}
                        <div className="col-span-7">
                          <select
                            required
                            value={item.stockItemId}
                            onChange={(e) =>
                              handleFormItemChange(index, "stockItemId", e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="" disabled>Select stock item...</option>
                            {selectedItem && (
                              <option value={selectedItem.id}>{selectedItem.name}</option>
                            )}
                            {availableItems.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Qty field with unit tag */}
                        <div className="col-span-4 flex items-center relative">
                          <input
                            type="number"
                            required
                            step="any"
                            min="0.0001"
                            placeholder="0.00"
                            value={item.quantity}
                            onChange={(e) =>
                              handleFormItemChange(index, "quantity", e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 pl-3 pr-10 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-emerald-500"
                          />
                          {unit && (
                            <span className="absolute right-3 text-[10px] font-semibold text-slate-400 pointer-events-none select-none">
                              {unit}
                            </span>
                          )}
                        </div>

                        {/* Delete row button */}
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredientRow(index)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                            title="Delete Row"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 gap-3">
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    disabled={formItems.length >= stockItems.length}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 py-1 px-2 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Ingredient Row
                  </button>
                  <div className="flex gap-2">
                    {hasExistingRecipe && (
                      <button
                        type="button"
                        onClick={triggerDeleteFromModal}
                        className="rounded-lg border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold mr-1 transition"
                      >
                        Wipe Recipe
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeRecipeModal}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white shadow transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Save Recipe
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Wipe Product Recipe?</h3>
             
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteRecipe}
                  className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 py-2.5 text-sm font-semibold text-white shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Wipe Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
