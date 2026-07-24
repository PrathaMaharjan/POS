"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import PaymentModal from "./PaymentModal";
import { useTheme } from "@/app/t/[tenantSlug]/pos/context/ThemeContext";
import {
  Search,
  ArrowLeft,
  Check,
  ImageOff,
  ShoppingCart,
  Trash2,
  CreditCard,
  SearchX,
  Plus,
  MessageSquare,
  X,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

interface ProductSize {
  id?: string;
  label: string;
  price: number;
  
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isActive: boolean;
  sizes?: ProductSize[];
}

interface CartItem {
  product: Product;
  size: ProductSize;
  quantity: number;
  note: string;
}

interface Outlet {
  id: string;
  name: string;
  taxRate?: number | string;
}

export interface OrderItemRecord {
  quantity: number;
  name: string;
  subtotal: number;
  orderItemId?: string;
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  tableId: string | null;
  status: "PENDING";
  total: number;
  subtotal: number;
  createdAt: string;
  items: OrderItemRecord[];
}

interface OrderProps {
  tenantSlug: string;
  tableId?: string | null;
  orderType?: "TAKEAWAY" | "DINE_IN";
  showHeader?: boolean;
  role?: "cashier" | "waiter";
  onOrderCreated?: (order: CreatedOrder) => void;
}

async function fetchVariants(
  productId: string,
  outletId: string | null,
): Promise<ProductSize[]> {
  try {
    const res = await api.get(
      `/product/${productId}/variants${outletId ? `?outletId=${outletId}` : ""}`,
    );
    const variants = res.data.variants ?? [];
    return variants.map((v: any) => ({
      id: v.id,
      label: v.label,
      price: Number(v.price),
      isAvailable: v.isAvailable,
    }));
  } catch {
    return [];
  }
}

function getRealSizes(product: Product): ProductSize[] | null {
  if (product.sizes && product.sizes.length > 1) return product.sizes;
  return null;
}

function cartKey(productId: string, sizeLabel: string) {
  return `${productId}::${sizeLabel}`;
}

export default function Order({
  tenantSlug: propTenantSlug,
  tableId = null,
  orderType = "TAKEAWAY",
  role = "cashier",
  showHeader = true,
  onOrderCreated,
}: OrderProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const accent = isDark ? "#e5b83b" : "#059669";
  const accentText = isDark ? "#0c0c0d" : "#ffffff";
  const pageBg = isDark ? "#0c0c0d" : "#ffffff";
  const sidebarBg = isDark ? "#0c0c0d" : "#059669";
  const surfaceBg = isDark ? "#141416" : "#ffffff";
  const surfaceBg2 = isDark ? "#1c1c1e" : "#d1fae5";
  const skeletonBg = isDark ? "#1c1c1e" : "#e2e8f0";
  const borderCol = isDark ? "#27272a" : "#e2e8f0";

  const borderHover = isDark ? "rgba(229,184,59,0.6)" : "rgba(5,150,105,0.6)";
  const textPrim = isDark ? "#ffffff" : "#1e293b";
  const textMuted = isDark ? "#a1a1aa" : "#64748b";
  const textFaint = isDark ? "#52525b" : "#94a3b8";
  const inputBg = isDark ? "#141416" : "#ffffff";
  const accentRing = isDark ? "rgba(229,184,59,0.2)" : "rgba(5,150,105,0.2)";
  const accentGlow = isDark
    ? "0 4px 20px rgba(229,184,59,0.15)"
    : "0 4px 20px rgba(5,150,105,0.15)";

  const sidebarTextPrim = isDark ? textPrim : "#ffffff";
  const sidebarTextMuted = isDark ? textMuted : "rgba(255,255,255,0.75)";
  const sidebarTextFaint = isDark ? textFaint : "rgba(255,255,255,0.55)";
  const sidebarBorderCol = isDark ? borderCol : "rgba(255,255,255,0.18)";
  const sidebarSurfaceBg = isDark ? surfaceBg : "rgba(255,255,255,0.12)";
  const sidebarSurfaceBg2 = isDark ? surfaceBg2 : "rgba(255,255,255,0.18)";
  const sidebarAccent = isDark ? accent : "#ffffff";
  const sidebarAccentText = isDark ? accentText : "#059669";

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>("ALL");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [createdTakeawayOrderId, setCreatedTakeawayOrderId] = useState<
    string | null
  >(null);

  const [taxRate, setTaxRate] = useState<number>(8);

  const [activeNoteKey, setActiveNoteKey] = useState<string | null>(null);

  const [sizeModalProduct, setSizeModalProduct] = useState<Product | null>(
    null,
  );

  const [activeOutletId, setActiveOutletId] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = propTenantSlug || params?.tenantSlug;

  const handleGoBack = () => {
    if (role === "waiter") {
      router.push(`/t/${tenantSlug}/pos/waiter`);
    } else {
      router.push(`/t/${tenantSlug}/pos/cashier`);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveOutletId(localStorage.getItem("activeOutletId"));
    }
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoadingCategories(true);
        const res = await api.get("/categories");
        const cats: Category[] = res.data.categories ?? [];
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    async function fetchProducts() {
      try {
        setIsLoadingProducts(true);
        const endpoint =
          activeCategory === "ALL"
            ? "/product"
            : `/product?categoryId=${activeCategory}`;
        const res = await api.get(endpoint);
        const data = res.data.products;
        const productsList: Product[] = Array.isArray(data)
          ? data
          : (data?.products ?? []);

        const withSizes = await Promise.all(
          productsList.map(async (p: any) => {
            const sizes = await fetchVariants(p.id, activeOutletId);
            return {
              ...p,
              sizes: sizes.length > 0 ? sizes : undefined,
            };
          }),
        );
        setProducts(withSizes);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [activeCategory, activeOutletId]);

  useEffect(() => {
    async function fetchOutletTaxRate() {
      try {
        const storedOutletId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeOutletId")
            : null;
        const res = await api.get("/outlets");
        const outlets: Outlet[] = res.data.outlets ?? [];

        const activeOutlet = storedOutletId
          ? outlets.find((o) => o.id === storedOutletId)
          : outlets[0];

        if (
          activeOutlet?.taxRate !== undefined &&
          activeOutlet?.taxRate !== null
        ) {
          const freshRate = parseFloat(String(activeOutlet.taxRate));
          if (!Number.isNaN(freshRate)) {
            setTaxRate(freshRate);
            if (typeof window !== "undefined" && activeOutlet.id) {
              localStorage.setItem(
                `taxRate_${activeOutlet.id}`,
                String(freshRate),
              );
            }
          }
        }
      } catch (err) {
        console.error(
          "Failed to fetch outlet tax rate, falling back to cached/default value:",
          err,
        );
        // Fall back to whatever's cached locally, or the 8% default, rather than blocking checkout
        if (typeof window !== "undefined") {
          const storedOutletId = localStorage.getItem("activeOutletId");
          const storedTaxRate = storedOutletId
            ? localStorage.getItem(`taxRate_${storedOutletId}`)
            : null;
          if (storedTaxRate) setTaxRate(parseFloat(storedTaxRate));
        }
      }
    }
    fetchOutletTaxRate();
  }, [tenantSlug]);

  const filteredProducts = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [products, searchQuery],
  );

  const handleProductClick = (product: Product) => {
    const sizes = getRealSizes(product);
    if (sizes) {
      setSizeModalProduct(product);
      return;
    }

    const basePrice = parseFloat(product.price) || 0;
    const key = cartKey(product.id, "");
    setCart((prev) => {
      const existing = prev.find(
        (item) => cartKey(item.product.id, item.size.label) === key,
      );
      if (existing) {
        return prev.filter(
          (item) => cartKey(item.product.id, item.size.label) !== key,
        );
      }
      return [
        ...prev,
        {
          product,
          size: { label: "", price: basePrice },
          quantity: 1,
          note: "",
        },
      ];
    });
  };

  const handleSelectSize = (product: Product, size: ProductSize) => {
    setCart((prev) => {
      const key = cartKey(product.id, size.label);
      const existing = prev.find(
        (item) => cartKey(item.product.id, item.size.label) === key,
      );
      if (existing) {
        return prev.map((item) =>
          cartKey(item.product.id, item.size.label) === key
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, size, quantity: 1, note: "" }];
    });
    setSizeModalProduct(null);
  };

  const handleDecreaseQuantity = (productId: string, sizeLabel: string) => {
    const key = cartKey(productId, sizeLabel);
    setCart((prev) => {
      const existing = prev.find(
        (item) => cartKey(item.product.id, item.size.label) === key,
      );
      if (existing?.quantity === 1) {
        if (activeNoteKey === key) setActiveNoteKey(null);
        return prev.filter(
          (item) => cartKey(item.product.id, item.size.label) !== key,
        );
      }
      return prev.map((item) =>
        cartKey(item.product.id, item.size.label) === key
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      );
    });
  };

  const handleIncreaseQuantity = (productId: string, sizeLabel: string) => {
    const key = cartKey(productId, sizeLabel);
    setCart((prev) =>
      prev.map((item) =>
        cartKey(item.product.id, item.size.label) === key
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  };

  const handleUpdateItemNote = (
    productId: string,
    sizeLabel: string,
    noteText: string,
  ) => {
    const key = cartKey(productId, sizeLabel);
    setCart((prev) =>
      prev.map((item) =>
        cartKey(item.product.id, item.size.label) === key
          ? { ...item, note: noteText }
          : item,
      ),
    );
  };

  const handleClearCart = () => {
    setCart([]);
    setActiveNoteKey(null);
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.size.price * item.quantity, 0),
    [cart],
  );

  const tax = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const handleAction = async () => {
    if (cart.length === 0) return;

    if (orderType === "DINE_IN") {
      try {
        setIsPlacingOrder(true);
        const res = await api.post("/orders/dine-in", {
          tableId,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items: cart.map(item => ({
            productId: item.product.id,
            variantId: item.size.id,
            quantity: item.quantity,
            notes: item.note.trim() || undefined,
          })),
        });

        const newOrder: CreatedOrder = {
          id: res.data.order.id,
          orderNumber: res.data.order.orderNumber,
          tableId,
          status: "PENDING",
          subtotal,
          total,
          createdAt: new Date().toISOString(),
          items: cart.map((item) => ({
            quantity: item.quantity,
            name: item.size.label
              ? `${item.product.name} (${item.size.label})`
              : item.product.name,
            subtotal: item.size.price * item.quantity,
          })),
        };

        onOrderCreated?.(newOrder);
        handleClearCart();
        setCustomerName('');
        setCustomerPhone('');
      } catch (err) {
        console.error("Failed to create dine-in order", err);
      } finally {
        setIsPlacingOrder(false);
      }
      return;
    }

    setIsPaymentOpen(true);
  };

  const handlePaymentComplete = () => {
    setIsPaymentOpen(false);
    handleClearCart();
    setCustomerName("");
    setCustomerPhone("");
    setCreatedTakeawayOrderId(null);
  };

  return (
    <div
      style={{ backgroundColor: pageBg, color: textPrim }}
      className="h-full flex flex-col font-sans select-none antialiased transition-colors duration-200"
    >
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Menu Grid */}
        <main className="flex-1 px-10 py-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <div
                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                style={{ color: textMuted }}
              >
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: inputBg,
                  borderColor: borderCol,
                  color: textPrim,
                }}
                className="w-full border rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-150 placeholder-neutral-400"
                onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
                onBlur={(e) => (e.currentTarget.style.borderColor = borderCol)}
              />
            </div>
            {showHeader && (
              <button
                onClick={handleGoBack}
                style={{
                  backgroundColor: surfaceBg,
                  borderColor: borderCol,
                  color: textMuted,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    borderHover;
                  (e.currentTarget as HTMLElement).style.color = textPrim;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    borderCol;
                  (e.currentTarget as HTMLElement).style.color = textMuted;
                }}
                className="flex items-center gap-2 border px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {isLoadingCategories ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: skeletonBg }}
                    className="h-9 w-24 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setActiveCategory("ALL")}
                  style={
                    activeCategory === "ALL"
                      ? {
                          backgroundColor: accent,
                          color: accentText,
                          borderColor: accent,
                        }
                      : {
                          backgroundColor: surfaceBg2,
                          color: textMuted,
                          borderColor: borderCol,
                        }
                  }
                  className="px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border transition-all duration-150"
                >
                  All Items
                </button>

                {categories.map((category, idx) => (
                  <button
                    key={`${category.id}-${idx}`}
                    onClick={() => setActiveCategory(category.id)}
                    style={
                      activeCategory === category.id
                        ? {
                            backgroundColor: accent,
                            color: accentText,
                            borderColor: accent,
                          }
                        : {
                            backgroundColor: surfaceBg2,
                            color: textMuted,
                            borderColor: borderCol,
                          }
                    }
                    className="px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border transition-all duration-150"
                  >
                    {category.name}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1 pb-4">
              {isLoadingProducts ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: surfaceBg,
                      borderColor: borderCol,
                    }}
                    className="border rounded-2xl p-3 flex flex-col gap-2"
                  >
                    <div
                      style={{ backgroundColor: skeletonBg }}
                      className="w-full aspect-[4/3] rounded-xl animate-pulse"
                    />
                    <div
                      style={{ backgroundColor: skeletonBg }}
                      className="h-3 w-3/4 rounded animate-pulse"
                    />
                    <div
                      style={{ backgroundColor: skeletonBg }}
                      className="h-4 w-1/3 rounded animate-pulse"
                    />
                  </div>
                ))
              ) : filteredProducts.length === 0 ? (
                <div
                  className="col-span-4 flex flex-col items-center justify-center py-20 gap-2"
                  style={{ color: textFaint }}
                >
                  <SearchX className="w-10 h-10" strokeWidth={1.5} />
                  <span className="text-sm font-medium">No items found</span>
                </div>
              ) : (
                filteredProducts.map((product, idx) => {
                  const isInCart = !!cart.find(
                    (item) => item.product.id === product.id,
                  );
                  const sizes = getRealSizes(product);
                  const priceNum = parseFloat(product.price);
                  const displayPrice = sizes
                    ? Math.min(...sizes.map((s) => s.price))
                    : priceNum;
                  return (
                    <div
                      key={`${product.id}-${idx}`}
                      onClick={
                        product.isAvailable
                          ? () => handleProductClick(product)
                          : undefined
                      }
                      style={{
                        backgroundColor: surfaceBg,
                        borderColor: isInCart ? accent : borderCol,
                        boxShadow: isInCart
                          ? `0 0 0 1px ${accentRing}`
                          : "none",
                      }}
                      className={`relative border rounded-2xl p-3 flex flex-col gap-2 overflow-hidden transition-all duration-200 ${
                        product.isAvailable
                          ? "cursor-pointer hover:-translate-y-0.5 hover:brightness-[1.03]"
                          : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div
                        style={{ backgroundColor: skeletonBg }}
                        className="relative w-full aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center"
                      >
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover"
                            priority={false}
                          />
                        ) : (
                          <ImageOff
                            className="w-8 h-8"
                            style={{ color: textFaint }}
                            strokeWidth={1.5}
                          />
                        )}
                        {isInCart && (
                          <div
                            className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]"
                            style={{
                              backgroundColor: isDark
                                ? "rgba(12,12,13,0.65)"
                                : "rgba(5,150,105,0.12)",
                            }}
                          >
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                              style={{
                                backgroundColor: accent,
                                color: accentText,
                              }}
                            >
                              <Check className="w-4 h-4" strokeWidth={3} />
                            </div>
                          </div>
                        )}
                        {!product.isAvailable && (
                          <div
                            className="absolute inset-0 flex items-center justify-center backdrop-blur-[1.5px]"
                            style={{ backgroundColor: "rgba(15, 15, 17, 0.7)" }}
                          >
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-neutral-200 bg-neutral-800/90 border border-neutral-700/50 shadow-sm">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className="flex flex-col gap-0.5 -mx-3 -mb-3 mt-1 px-3 pt-2.5 pb-3 rounded-b-2xl"
                        style={{
                          backgroundColor: isDark ? "transparent" : "#059669",
                        }}
                      >
                        <span
                          className="text-[13px] font-semibold truncate"
                          style={{ color: isDark ? textPrim : "#ffffff" }}
                        >
                          {product.name}
                        </span>
                        {product.description && (
                          <span
                            className="text-[11px] line-clamp-2 break-words"
                            style={{
                              color: isDark
                                ? textMuted
                                : "rgba(255,255,255,0.75)",
                            }}
                          >
                            {product.description}
                          </span>
                        )}
                        {sizes ? (
                          <div className="flex flex-col mt-1 gap-0.5">
                            {sizes.map((s) => (
                              <div
                                key={s.id}
                                className="flex justify-between items-center text-[12px]"
                              >
                                <span
                                  style={{
                                    color: isDark
                                      ? textMuted
                                      : "rgba(255,255,255,0.8)",
                                  }}
                                >
                                  {s.label}
                                </span>
                                <span
                                  className="font-bold"
                                  style={{ color: isDark ? accent : "#ffffff" }}
                                >
                                  Rs.{s.price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span
                            className="text-sm font-bold mt-0.5"
                            style={{ color: isDark ? accent : "#ffffff" }}
                          >
                            Rs.{displayPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>

        {/* Sidebar Cart */}
        <aside
          style={{
            backgroundColor: sidebarBg,
            borderColor: sidebarBorderCol,
          }}
          className="w-[300px] xl:w-[350px] border-l p-5 flex flex-col gap-4 overflow-hidden shrink-0"
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-bold tracking-wide"
              style={{ color: sidebarTextPrim }}
            >
              Active Order
            </h2>
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                style={{ color: sidebarTextMuted }}
                className="p-1.5 rounded-lg transition-colors hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cart items list with customized notes section */}
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
            {cart.length === 0 ? (
              <div
                className="flex-1 flex flex-col items-center justify-center gap-2"
                style={{ color: sidebarTextFaint }}
              >
                <ShoppingCart className="w-10 h-10" strokeWidth={1.5} />
                <span className="text-sm font-medium">Cart is empty</span>
              </div>
            ) : (
              cart.map((item, idx) => {
                const totalItemPrice = item.size.price * item.quantity;
                const key = cartKey(item.product.id, item.size.label);
                const isNoteSectionOpen = activeNoteKey === key;

                return (
                  <div
                    key={`${key}-${idx}`}
                    style={{
                      backgroundColor: sidebarSurfaceBg,
                      borderColor: sidebarBorderCol,
                    }}
                    className="group relative flex flex-col p-3 rounded-xl border transition-all duration-150 gap-2 cursor-pointer"
                    onClick={() =>
                      setActiveNoteKey(isNoteSectionOpen ? null : key)
                    }
                  >
                    <div
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: sidebarAccent }}
                    />

                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{
                            backgroundColor: sidebarSurfaceBg2,
                            borderColor: sidebarBorderCol,
                          }}
                          className="flex items-center rounded-lg border p-0.5 gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()} // Stop note block drop down toggling on count edit
                        >
                          <button
                            onClick={() =>
                              handleDecreaseQuantity(
                                item.product.id,
                                item.size.label,
                              )
                            }
                            style={{ color: sidebarTextMuted }}
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:text-red-300 transition-colors text-sm font-bold"
                          >
                            -
                          </button>
                          <span
                            className="text-xs font-bold w-4 text-center"
                            style={{ color: sidebarTextPrim }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleIncreaseQuantity(
                                item.product.id,
                                item.size.label,
                              )
                            }
                            style={{ color: sidebarTextMuted }}
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:text-emerald-200 transition-colors text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-col overflow-hidden max-w-[120px] xl:max-w-[150px]">
                          <span
                            className="text-[13px] font-semibold truncate"
                            style={{ color: sidebarTextPrim }}
                          >
                            {item.product.name}
                          </span>
                          {item.size.label && (
                            <span
                              className="text-[10px] font-bold w-fit px-1.5 py-[1px] rounded mt-0.5"
                              style={{
                                backgroundColor: sidebarSurfaceBg2,
                                color: sidebarAccent,
                              }}
                            >
                              {item.size.label}
                            </span>
                          )}
                          {item.note && !isNoteSectionOpen && (
                            <span
                              className="text-[11px] truncate italic opacity-90 flex items-center gap-1 mt-0.5"
                              style={{ color: sidebarTextMuted }}
                            >
                              <MessageSquare className="w-2.5 h-2.5 shrink-0" />{" "}
                              {item.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className="text-sm font-bold shrink-0"
                        style={{ color: sidebarTextPrim }}
                      >
                        Rs.{totalItemPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Expandable note text input layout */}
                    {isNoteSectionOpen && (
                      <div
                        className="w-full mt-1 pt-1 border-t"
                        style={{ borderColor: sidebarBorderCol }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className="flex items-center gap-1.5 text-[11px] mb-1 font-semibold"
                          style={{ color: sidebarTextMuted }}
                        >
                          <MessageSquare className="w-3 h-3" /> Item
                          Instructions
                        </div>
                        <input
                          type="text"
                          placeholder="No spicy, extra cheese, etc..."
                          value={item.note}
                          onChange={(e) =>
                            handleUpdateItemNote(
                              item.product.id,
                              item.size.label,
                              e.target.value,
                            )
                          }
                          style={{
                            backgroundColor: sidebarSurfaceBg2,
                            borderColor: sidebarBorderCol,
                            color: sidebarTextPrim,
                          }}
                          className="w-full border rounded-lg py-1.5 px-2.5 text-xs outline-none placeholder-white/40 focus:ring-1 focus:ring-white/20"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Totals + Actions Footer */}
          <div
            style={{ borderColor: sidebarBorderCol }}
            className="border-t pt-4 flex flex-col gap-3"
          >
            {orderType === "TAKEAWAY" && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Customer name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    backgroundColor: sidebarSurfaceBg,
                    borderColor: sidebarBorderCol,
                    color: sidebarTextPrim,
                  }}
                  className="w-full border rounded-xl py-2 px-3 text-sm outline-none transition-all duration-150 placeholder-white/50"
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = sidebarAccent)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = sidebarBorderCol)
                  }
                />
                <input
                  type="text"
                  placeholder="Phone number (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    backgroundColor: sidebarSurfaceBg,
                    borderColor: sidebarBorderCol,
                    color: sidebarTextPrim,
                  }}
                  className="w-full border rounded-xl py-2 px-3 text-sm outline-none transition-all duration-150 placeholder-white/50"
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = sidebarAccent)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = sidebarBorderCol)
                  }
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: sidebarTextMuted }}>Subtotal</span>
                <span
                  className="font-semibold"
                  style={{ color: sidebarTextPrim }}
                >
                  Rs.{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: sidebarTextMuted }}>
                  Tax ({taxRate}%)
                </span>
                <span
                  className="font-semibold"
                  style={{ color: sidebarTextPrim }}
                >
                  Rs.{tax.toFixed(2)}
                </span>
              </div>
              <div
                style={{ borderColor: sidebarBorderCol }}
                className="flex justify-between font-bold border-t pt-2 mt-1"
              >
                <span style={{ color: sidebarTextPrim }}>Total</span>
                <span className="text-xl" style={{ color: sidebarTextPrim }}>
                  Rs.{total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleAction}
              disabled={cart.length === 0 || isPlacingOrder}
              style={{
                backgroundColor: sidebarAccent,
                color: sidebarAccentText,
                boxShadow: isDark ? accentGlow : "0 4px 20px rgba(0,0,0,0.15)",
              }}
              className="w-full font-bold text-[14px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? (
                "Placing Order..."
              ) : orderType === "DINE_IN" ? (
                <>
                  <Plus className="w-4 h-4" strokeWidth={2.5} /> Place Order
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" strokeWidth={2.5} /> Checkout
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {sizeModalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={() => setSizeModalProduct(null)}
        >
          <div
            className={`w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4 shadow-2xl ${!isDark ? "bg-emerald-600" : "border"}`}
            style={
              isDark
                ? { backgroundColor: surfaceBg, borderColor: borderCol }
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <h3
                  className={`text-base font-bold ${!isDark ? "text-white" : ""}`}
                  style={isDark ? { color: textPrim } : undefined}
                >
                  {sizeModalProduct.name}
                </h3>
                {sizeModalProduct.description && (
                  <p
                    className={`text-xs ${!isDark ? "text-emerald-50" : ""}`}
                    style={isDark ? { color: textMuted } : undefined}
                  >
                    {sizeModalProduct.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSizeModalProduct(null)}
                className={`shrink-0 p-1 rounded-lg transition-all ${!isDark ? "text-emerald-100 hover:text-white hover:bg-white/20" : "hover:opacity-70"}`}
                style={isDark ? { color: textMuted } : undefined}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(getRealSizes(sizeModalProduct) ?? []).map((size) => (
                <button
                  key={size.label}
                  onClick={() => handleSelectSize(sizeModalProduct, size)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-3 px-2 transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] ${!isDark ? "shadow-sm" : "border hover:brightness-[1.03]"}`}
                  style={{
                    backgroundColor: isDark ? surfaceBg2 : "#ffffff",
                    borderColor: isDark ? borderCol : undefined,
                  }}
                  onMouseEnter={
                    isDark
                      ? (e) =>
                          ((e.currentTarget as HTMLElement).style.borderColor =
                            accent)
                      : undefined
                  }
                  onMouseLeave={
                    isDark
                      ? (e) =>
                          ((e.currentTarget as HTMLElement).style.borderColor =
                            borderCol)
                      : undefined
                  }
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: isDark ? textPrim : "#1e293b" }}
                  >
                    {size.label}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isDark ? accent : "#059669" }}
                  >
                    Rs.{size.price.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={handlePaymentComplete}
        orderId={createdTakeawayOrderId}
        totalAmount={subtotal}
        subtotalAmount={subtotal}
        customerName={customerName}
        customerPhone={customerPhone}
        orderType="TAKEAWAY"
        tableId={null}
        cart={cart.map((item) => ({
          productId: item.product.id,
          variantId: item.size.id,
          quantity: item.quantity,
          name: item.size.label
            ? `${item.product.name} (${item.size.label})`
            : item.product.name,
          price: item.size.price,
          notes: item.note.trim() || undefined,
        }))}
      />
    </div>
  );
}
