"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import PaymentModal from './PaymentModal';
import { useTheme } from '@/app/t/[tenantSlug]/pos/context/ThemeContext';
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
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
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
}

interface CartItem {
  product: Product;
  quantity: number;
  note: string;
}

export interface OrderItemRecord {
  quantity: number;
  name: string;
  subtotal: number;
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  tableId: string | null;
  status: 'PENDING';
  total: number;
  subtotal: number;
  createdAt: string;
  items: OrderItemRecord[];
}

interface OrderProps {
  tenantSlug: string;
  tableId?: string | null;
  orderType?: 'TAKEAWAY' | 'DINE_IN';
  showHeader?: boolean;
  role?: 'cashier' | 'waiter';
  onOrderCreated?: (order: CreatedOrder) => void;
}

export default function Order({
  tenantSlug: propTenantSlug,
  tableId = null,
  orderType = 'TAKEAWAY',
  role = 'cashier',
  showHeader = true,
  onOrderCreated,
}: OrderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const accent = isDark ? '#e5b83b' : '#059669';
  const accentText = isDark ? '#0c0c0d' : '#ffffff';
  const pageBg = isDark ? '#0c0c0d' : '#ffffff';
  const sidebarBg = isDark ? '#0c0c0d' : '#059669';
  const surfaceBg = isDark ? '#141416' : '#ffffff';
  const surfaceBg2 = isDark ? '#1c1c1e' : '#d1fae5';
  const skeletonBg = isDark ? '#1c1c1e' : '#e2e8f0';
  const borderCol = isDark ? '#27272a' : '#e2e8f0';

  const borderHover = isDark ? 'rgba(229,184,59,0.6)' : 'rgba(5,150,105,0.6)';
  const textPrim = isDark ? '#ffffff' : '#1e293b';
  const textMuted = isDark ? '#a1a1aa' : '#64748b';
  const textFaint = isDark ? '#52525b' : '#94a3b8';
  const inputBg = isDark ? '#141416' : '#ffffff';
  const accentRing = isDark ? 'rgba(229,184,59,0.2)' : 'rgba(5,150,105,0.2)';
  const accentGlow = isDark ? '0 4px 20px rgba(229,184,59,0.15)' : '0 4px 20px rgba(5,150,105,0.15)';

  // Sidebar-specific colors
  const sidebarTextPrim = isDark ? textPrim : '#ffffff';
  const sidebarTextMuted = isDark ? textMuted : 'rgba(255,255,255,0.75)';
  const sidebarTextFaint = isDark ? textFaint : 'rgba(255,255,255,0.55)';
  const sidebarBorderCol = isDark ? borderCol : 'rgba(255,255,255,0.18)';
  const sidebarSurfaceBg = isDark ? surfaceBg : 'rgba(255,255,255,0.12)';
  const sidebarSurfaceBg2 = isDark ? surfaceBg2 : 'rgba(255,255,255,0.18)';
  const sidebarAccent = isDark ? accent : '#ffffff';
  const sidebarAccentText = isDark ? accentText : '#059669';

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [createdTakeawayOrderId, setCreatedTakeawayOrderId] = useState<string | null>(null);

  // Tracks which cart item layout is open for custom notes
  const [activeNoteProductId, setActiveNoteProductId] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = propTenantSlug || params?.tenantSlug;

  const handleGoBack = () => {
    if (role === 'waiter') {
      router.push(`/t/${tenantSlug}/pos/waiter`);
    } else {
      router.push(`/t/${tenantSlug}/pos/cashier`);
    }
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoadingCategories(true);
        const res = await api.get('/categories');
        const cats: Category[] = res.data.categories ?? [];
        setCategories(cats);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
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
        const endpoint = activeCategory === 'ALL' ? '/product' : `/product?categoryId=${activeCategory}`;
        const res = await api.get(endpoint);
        const data = res.data.products;
        const productsList = Array.isArray(data) ? data : (data?.products ?? []);
        setProducts(productsList);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [activeCategory]);

  const filteredProducts = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [products, searchQuery]
  );

  const handleAddProduct = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) return prev.filter(item => item.product.id !== product.id);
      return [...prev, { product, quantity: 1, note: '' }];
    });
  };

  const handleDecreaseQuantity = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing?.quantity === 1) {
        if (activeNoteProductId === productId) setActiveNoteProductId(null);
        return prev.filter(item => item.product.id !== productId);
      }
      return prev.map(item =>
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const handleIncreaseQuantity = (productId: string) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleUpdateItemNote = (productId: string, noteText: string) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, note: noteText } : item
      )
    );
  };

  const handleClearCart = () => {
    setCart([]);
    setActiveNoteProductId(null);
  };

  const subtotal = useMemo(() =>
    cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0),
    [cart]
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleAction = async () => {
    if (cart.length === 0) return;

    if (orderType === 'DINE_IN') {
      try {
        setIsPlacingOrder(true);
        const res = await api.post('/orders/dine-in', {
          tableId,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            notes: item.note.trim() || undefined,
          })),
        });

        const newOrder: CreatedOrder = {
          id: res.data.order.id,
          orderNumber: res.data.order.orderNumber,
          tableId,
          status: 'PENDING',
          subtotal,
          total,
          createdAt: new Date().toISOString(),
          items: cart.map(item => ({
            quantity: item.quantity,
            name: item.product.name,
            subtotal: parseFloat(item.product.price) * item.quantity,
          })),
        };

        onOrderCreated?.(newOrder);
        handleClearCart();
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
    setCustomerName('');
    setCustomerPhone('');
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
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: textMuted }}>
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: inputBg,
                  borderColor: borderCol,
                  color: textPrim,
                }}
                className="w-full border rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-150 placeholder-neutral-400"
                onFocus={e => (e.currentTarget.style.borderColor = accent)}
                onBlur={e => (e.currentTarget.style.borderColor = borderCol)}
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
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = borderHover;
                  (e.currentTarget as HTMLElement).style.color = textPrim;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = borderCol;
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
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ backgroundColor: skeletonBg }} className="h-9 w-24 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setActiveCategory('ALL')}
                  style={
                    activeCategory === 'ALL'
                      ? { backgroundColor: accent, color: accentText, borderColor: accent }
                      : { backgroundColor: surfaceBg2, color: textMuted, borderColor: borderCol }
                  }
                  className="px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border transition-all duration-150"
                >
                  All Items
                </button>

                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    style={
                      activeCategory === category.id
                        ? { backgroundColor: accent, color: accentText, borderColor: accent }
                        : { backgroundColor: surfaceBg2, color: textMuted, borderColor: borderCol }
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
                  <div key={i} style={{ backgroundColor: surfaceBg, borderColor: borderCol }} className="border rounded-2xl p-3 flex flex-col gap-2">
                    <div style={{ backgroundColor: skeletonBg }} className="w-full aspect-[4/3] rounded-xl animate-pulse" />
                    <div style={{ backgroundColor: skeletonBg }} className="h-3 w-3/4 rounded animate-pulse" />
                    <div style={{ backgroundColor: skeletonBg }} className="h-4 w-1/3 rounded animate-pulse" />
                  </div>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-4 flex flex-col items-center justify-center py-20 gap-2" style={{ color: textFaint }}>
                  <SearchX className="w-10 h-10" strokeWidth={1.5} />
                  <span className="text-sm font-medium">No items found</span>
                </div>
              ) : (
                filteredProducts.map(product => {
                  const isInCart = !!cart.find(item => item.product.id === product.id);
                  const priceNum = parseFloat(product.price);
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      style={{
                        backgroundColor: surfaceBg,
                        borderColor: isInCart ? accent : borderCol,
                        boxShadow: isInCart ? `0 0 0 1px ${accentRing}` : 'none',
                      }}
                      className="relative border rounded-2xl p-3 flex flex-col gap-2 cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.03]"
                    >
                      <div style={{ backgroundColor: skeletonBg }} className="relative w-full aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center">
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
                          <ImageOff className="w-8 h-8" style={{ color: textFaint }} strokeWidth={1.5} />
                        )}
                        {isInCart && (
                          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]" style={{ backgroundColor: isDark ? 'rgba(12,12,13,0.65)' : 'rgba(5,150,105,0.12)' }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: accent, color: accentText }}>
                              <Check className="w-4 h-4" strokeWidth={3} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-semibold truncate" style={{ color: textPrim }}>{product.name}</span>
                        <span className="text-sm font-bold" style={{ color: accent }}>Rs.{priceNum.toFixed(2)}</span>
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
            <h2 className="text-lg font-bold tracking-wide" style={{ color: sidebarTextPrim }}>Active Order</h2>
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
              <div className="flex-1 flex flex-col items-center justify-center gap-2" style={{ color: sidebarTextFaint }}>
                <ShoppingCart className="w-10 h-10" strokeWidth={1.5} />
                <span className="text-sm font-medium">Cart is empty</span>
              </div>
            ) : (
              cart.map(item => {
                const priceNum = parseFloat(item.product.price);
                const totalItemPrice = priceNum * item.quantity;
                const isNoteSectionOpen = activeNoteProductId === item.product.id;

                return (
                  <div
                    key={item.product.id}
                    style={{ backgroundColor: sidebarSurfaceBg, borderColor: sidebarBorderCol }}
                    className="group relative flex flex-col p-3 rounded-xl border transition-all duration-150 gap-2 cursor-pointer"
                    onClick={() => setActiveNoteProductId(isNoteSectionOpen ? null : item.product.id)}
                  >
                    <div
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: sidebarAccent }}
                    />

                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{ backgroundColor: sidebarSurfaceBg2, borderColor: sidebarBorderCol }}
                          className="flex items-center rounded-lg border p-0.5 gap-1 shrink-0"
                          onClick={e => e.stopPropagation()} // Stop note block drop down toggling on count edit
                        >
                          <button
                            onClick={() => handleDecreaseQuantity(item.product.id)}
                            style={{ color: sidebarTextMuted }}
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:text-red-300 transition-colors text-sm font-bold"
                          >-</button>
                          <span className="text-xs font-bold w-4 text-center" style={{ color: sidebarTextPrim }}>{item.quantity}</span>
                          <button
                            onClick={() => handleIncreaseQuantity(item.product.id)}
                            style={{ color: sidebarTextMuted }}
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:text-emerald-200 transition-colors text-sm font-bold"
                          >+</button>
                        </div>
                        <div className="flex flex-col overflow-hidden max-w-[120px] xl:max-w-[150px]">
                          <span className="text-[13px] font-semibold truncate" style={{ color: sidebarTextPrim }}>{item.product.name}</span>
                          {item.note && !isNoteSectionOpen && (
                            <span className="text-[11px] truncate italic opacity-90 flex items-center gap-1 mt-0.5" style={{ color: sidebarTextMuted }}>
                              <MessageSquare className="w-2.5 h-2.5 shrink-0" /> {item.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold shrink-0" style={{ color: sidebarTextPrim }}>Rs.{totalItemPrice.toFixed(2)}</span>
                    </div>

                    {/* Expandable note text input layout */}
                    {isNoteSectionOpen && (
                      <div className="w-full mt-1 pt-1 border-t" style={{ borderColor: sidebarBorderCol }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 text-[11px] mb-1 font-semibold" style={{ color: sidebarTextMuted }}>
                          <MessageSquare className="w-3 h-3" /> Item Instructions
                        </div>
                        <input
                          type="text"
                          placeholder="No spicy, extra cheese, etc..."
                          value={item.note}
                          onChange={e => handleUpdateItemNote(item.product.id, e.target.value)}
                          style={{
                            backgroundColor: sidebarSurfaceBg2,
                            borderColor: sidebarBorderCol,
                            color: sidebarTextPrim
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
          <div style={{ borderColor: sidebarBorderCol }} className="border-t pt-4 flex flex-col gap-3">
            {orderType === 'TAKEAWAY' && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Customer name (optional)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  style={{ backgroundColor: sidebarSurfaceBg, borderColor: sidebarBorderCol, color: sidebarTextPrim }}
                  className="w-full border rounded-xl py-2 px-3 text-sm outline-none transition-all duration-150 placeholder-white/50"
                  onFocus={e => (e.currentTarget.style.borderColor = sidebarAccent)}
                  onBlur={e => (e.currentTarget.style.borderColor = sidebarBorderCol)}
                />
                <input
                  type="text"
                  placeholder="Phone number (optional)"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  style={{ backgroundColor: sidebarSurfaceBg, borderColor: sidebarBorderCol, color: sidebarTextPrim }}
                  className="w-full border rounded-xl py-2 px-3 text-sm outline-none transition-all duration-150 placeholder-white/50"
                  onFocus={e => (e.currentTarget.style.borderColor = sidebarAccent)}
                  onBlur={e => (e.currentTarget.style.borderColor = sidebarBorderCol)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: sidebarTextMuted }}>Subtotal</span>
                <span className="font-semibold" style={{ color: sidebarTextPrim }}>Rs.{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: sidebarTextMuted }}>Tax (8%)</span>
                <span className="font-semibold" style={{ color: sidebarTextPrim }}>Rs.{tax.toFixed(2)}</span>
              </div>
              <div style={{ borderColor: sidebarBorderCol }} className="flex justify-between font-bold border-t pt-2 mt-1">
                <span style={{ color: sidebarTextPrim }}>Total</span>
                <span className="text-xl" style={{ color: sidebarTextPrim }}>Rs.{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleAction}
              disabled={cart.length === 0 || isPlacingOrder}
              style={{
                backgroundColor: sidebarAccent,
                color: sidebarAccentText,
                boxShadow: isDark ? accentGlow : '0 4px 20px rgba(0,0,0,0.15)',
              }}
              className="w-full font-bold text-[14px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? (
                'Placing Order...'
              ) : orderType === 'DINE_IN' ? (
                <><Plus className="w-4 h-4" strokeWidth={2.5} /> Place Order</>
              ) : (
                <><CreditCard className="w-4 h-4" strokeWidth={2.5} /> Checkout</>
              )}
            </button>
          </div>
        </aside>
      </div>

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
        cart={cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          name: item.product.name,
          price: parseFloat(item.product.price),
          notes: item.note.trim() || undefined,
        }))}
      />
    </div>
  );
}