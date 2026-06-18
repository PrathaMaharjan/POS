"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  role?: string; // Accept role prop
  onOrderCreated?: (order: CreatedOrder) => void;
}

export default function Order({
  tenantSlug,
  tableId = null,
  orderType = 'TAKEAWAY',
  showHeader = true,
  role,
  onOrderCreated,
}: OrderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const accent        = isDark ? '#e5b83b' : '#16a34a';
  const accentText    = isDark ? '#0c0c0d' : '#ffffff';
  const pageBg     = isDark ? '#0c0c0d' : '#f6fdf7';
  const surfaceBg  = isDark ? '#141416' : '#edfaf0';
  const surfaceBg2 = isDark ? '#1c1c1e' : '#d9f5df';
  const skeletonBg = isDark ? '#1c1c1e' : '#d9f5df';
  const borderCol  = isDark ? '#27272a' : '#a8e6b3';

  const borderHover   = isDark ? 'rgba(229,184,59,0.6)' : 'rgba(22,163,74,0.6)';
  const textPrim      = isDark ? '#ffffff' : '#14532d';
  const textMuted     = isDark ? '#a1a1aa' : '#4b7a58';
  const textFaint     = isDark ? '#52525b' : '#86efac';
  const inputBg       = isDark ? '#141416' : '#f0fdf4';
  const accentRing    = isDark ? 'rgba(229,184,59,0.2)' : 'rgba(22,163,74,0.2)';
  const accentGlow    = isDark ? '0 4px 20px rgba(229,184,59,0.15)' : '0 4px 20px rgba(22,163,74,0.15)';

  const cartLineBg    = isDark ? '#0c0c0d' : '#f0fdf4';
  // ─────────────────────────────────────────────────────────────

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
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
  const router = useRouter();

  // Determine if this specific action should be restricted
  const isDineInCashier = role === 'cashier' && orderType === 'DINE_IN';

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoadingCategories(true);
        const res = await api.get('/categories');
        const cats: Category[] = res.data.categories ?? [];
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
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
        const res = await api.get(`/categories/${activeCategory}/products`);
        setProducts(res.data.products ?? []);
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
      if (existing?.quantity === 1) return prev.filter(item => item.product.id !== productId);
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

  const handleClearCart = () => setCart([]);

  const subtotal = useMemo(() =>
    cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0),
    [cart]
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleAction = async () => {
    if (cart.length === 0 || isDineInCashier) return;

    if (orderType === 'DINE_IN') {
      try {
        setIsPlacingOrder(true);

        const res = await api.post('/orders/dine-in', {
          tableId,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            notes: item.note || undefined,
          })),
        });

        console.log("Dine-in order saved:", res.data);

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

    setIsPlacingOrder(true);
    try {
      const res = await api.post('/orders/takeaway', {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.note || undefined,
        })),
      });
      setCreatedTakeawayOrderId(res.data.order.id);
      setIsPaymentOpen(true);
    } catch (err: any) {
      console.error('Failed to place order:', err);
      const message = err.response?.data?.error;
      alert(typeof message === 'string' ? message : 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
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

        {/* Main content */}
        <main className="flex-1 px-10 py-6 flex flex-col gap-4 overflow-hidden">

          {/* Search + Back */}
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
            <button
              onClick={() => router.back()}
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
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {isLoadingCategories ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ backgroundColor: skeletonBg }} className="h-9 w-24 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <span className="text-sm" style={{ color: textMuted }}>No categories found</span>
            ) : (
              categories.map(category => (
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
              ))
            )}
          </div>

          {/* Product grid */}
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
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff className="w-8 h-8" style={{ color: textFaint }} strokeWidth={1.5} />
                        )}
                        {isInCart && (
                          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]" style={{ backgroundColor: isDark ? 'rgba(12,12,13,0.65)' : 'rgba(240,253,244,0.75)' }}>
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
            backgroundColor: pageBg,
            borderColor: borderCol,
          }}
          className="w-[300px] xl:w-[340px] border-l p-5 flex flex-col gap-4 overflow-hidden shrink-0"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-wide" style={{ color: textPrim }}>Active Order</h2>
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                style={{ color: textMuted }}
                className="p-1.5 rounded-lg transition-colors hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2" style={{ color: textFaint }}>
                <ShoppingCart className="w-10 h-10" strokeWidth={1.5} />
                <span className="text-sm font-medium">Cart is empty</span>
              </div>
            ) : (
              cart.map(item => {
                const priceNum = parseFloat(item.product.price);
                const totalItemPrice = priceNum * item.quantity;
                return (
                  <div
                    key={item.product.id}
                    style={{ backgroundColor: surfaceBg, borderColor: borderCol }}
                    className="group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-150"
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${accent}50`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = borderCol)}
                  >
                    <div
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: surfaceBg2, borderColor: borderCol }}
                        className="flex items-center rounded-lg border p-0.5 gap-1"
                      >
                        <button
                          onClick={e => { e.stopPropagation(); handleDecreaseQuantity(item.product.id); }}
                          style={{ color: textMuted }}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:text-red-500 transition-colors text-sm font-bold"
                        >-</button>
                        <span className="text-xs font-bold w-4 text-center" style={{ color: accent }}>{item.quantity}</span>
                        <button
                          onClick={e => { e.stopPropagation(); handleIncreaseQuantity(item.product.id); }}
                          style={{ color: textMuted }}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:text-green-500 transition-colors text-sm font-bold"
                        >+</button>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold" style={{ color: textPrim }}>{item.product.name}</span>
                        {item.note && <span className="text-[11px]" style={{ color: textMuted }}>{item.note}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: textPrim }}>Rs.{totalItemPrice.toFixed(2)}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Totals + CTA */}
          <div style={{ borderColor: borderCol }} className="border-t pt-4 flex flex-col gap-3">

            {orderType === 'TAKEAWAY' && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Customer name (optional)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: textPrim }}
                  className="w-full border rounded-xl py-2 px-3 text-sm outline-none transition-all duration-150 placeholder-neutral-400"
                  onFocus={e => (e.currentTarget.style.borderColor = accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = borderCol)}
                />
                <input
                  type="text"
                  placeholder="Phone number (optional)"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: textPrim }}
                  className="w-full border rounded-xl py-2 px-3 text-sm outline-none transition-all duration-150 placeholder-neutral-400"
                  onFocus={e => (e.currentTarget.style.borderColor = accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = borderCol)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: textMuted }}>Subtotal</span>
                <span className="font-semibold" style={{ color: textPrim }}>Rs.{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: textMuted }}>Tax (8%)</span>
                <span className="font-semibold" style={{ color: textPrim }}>Rs.{tax.toFixed(2)}</span>
              </div>
              <div style={{ borderColor: borderCol }} className="flex justify-between font-bold border-t pt-2 mt-1">
                <span style={{ color: textPrim }}>Total</span>
                <span className="text-xl" style={{ color: accent }}>Rs.{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Combined CTA Button */}
            <button
              onClick={handleAction}
              disabled={cart.length === 0 || isPlacingOrder || isDineInCashier}
              style={{
                backgroundColor: isDineInCashier ? (isDark ? '#27272a' : '#e5e5e5') : accent,
                color: isDineInCashier ? textMuted : accentText,
                boxShadow: isDineInCashier ? 'none' : accentGlow,
              }}
              className="w-full font-bold text-[14px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? (
                'Placing Order...'
              ) : isDineInCashier ? (
                'Order Disabled for Cashier'
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
        orderType="TAKEAWAY"
        tableId={null}
        cart={cart.map(item => ({
          quantity: item.quantity,
          name: item.product.name,
          price: parseFloat(item.product.price),
        }))}
      />
    </div>
  );
}