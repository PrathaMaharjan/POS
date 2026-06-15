"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PaymentModal from './PaymentModal';
import {
  Search,
  ArrowLeft,
  Check,
  ImageOff,
  ShoppingCart,
  Trash2,
  Plus,
  CreditCard,
  SearchX,
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
  tableId: number | null;
  status: 'PENDING';
  total: number;
  subtotal: number;
  createdAt: string;
  items: OrderItemRecord[];
}

interface OrderProps {
  tenantSlug: string;
  tableId?: number | null;
  orderType?: 'TAKEAWAY' | 'DINE_IN';
  showHeader?: boolean;
  onOrderCreated?: (order: CreatedOrder) => void;
}

export default function Order({
  tenantSlug,
  tableId = null,
  orderType = 'TAKEAWAY',
  showHeader = true,
  onOrderCreated,
}: OrderProps) {
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
  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoadingCategories(true);
        const res = await api.get('/categories');
        const cats: Category[] = res.data.categories ?? [];
        setCategories(cats);
        if (cats.length > 0) {
          setActiveCategory(cats[0].id);
        }
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

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleAddProduct = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.filter(item => item.product.id !== product.id);
      }
      return [...prev, { product, quantity: 1, note: '' }];
    });
  };

  const handleDecreaseQuantity = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing?.quantity === 1) {
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

  const handleClearCart = () => setCart([]);

  const subtotal = useMemo(() =>
    cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0),
    [cart]
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleAction = async () => {
    if (cart.length === 0) return;

    if (orderType === 'DINE_IN') {
      const newOrder: CreatedOrder = {
        id: crypto.randomUUID(),
        orderNumber: String(Math.floor(1000 + Math.random() * 9000)),
        tableId,
        status: 'PENDING',
        total,
        subtotal,
        createdAt: new Date().toISOString(),
        items: cart.map(item => ({
          quantity: item.quantity,
          name: item.product.name,
          subtotal: parseFloat(item.product.price) * item.quantity,
        })),
      };
      onOrderCreated?.(newOrder);
      handleClearCart();
      return;
    }

    setIsPlacingOrder(true);
    try {
      await api.post('/orders/takeaway', {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.note || undefined,
        })),
      });


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
  };

  return (
    <div className="h-full bg-[#0c0c0d] text-[#e4e4e7] flex flex-col font-sans select-none antialiased">
      <div className="flex-1 flex overflow-hidden">

        <main className="flex-1 px-10 py-6 flex flex-col gap-4 overflow-hidden">

          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141416] border border-neutral-800 focus:border-[#e5b83b]/60 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-neutral-500 outline-none transition-all duration-150"
              />
            </div>
            <button
              onClick={() => router.push(`/t/${tenantSlug}/pos`)}
              className="flex items-center gap-2 bg-[#141416] border border-neutral-800 hover:border-[#e5b83b]/60 text-neutral-400 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 shrink-0"
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
                  <div key={i} className="h-9 w-24 rounded-lg bg-[#1c1c1e] animate-pulse" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <span className="text-sm text-neutral-500">No categories found</span>
            ) : (
              categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                    activeCategory === category.id
                      ? 'bg-[#e5b83b] text-[#0c0c0d] font-bold'
                      : 'bg-[#1c1c1e] text-neutral-400 border border-neutral-800 hover:text-white'
                  }`}
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
                  <div key={i} className="bg-[#141416] border border-neutral-800 rounded-2xl p-3 flex flex-col gap-2">
                    <div className="w-full aspect-[4/3] bg-neutral-900 rounded-xl animate-pulse" />
                    <div className="h-3 w-3/4 bg-neutral-900 rounded animate-pulse" />
                    <div className="h-4 w-1/3 bg-neutral-900 rounded animate-pulse" />
                  </div>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-4 flex flex-col items-center justify-center py-20 text-neutral-600 gap-2">
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
                      className={`relative bg-[#141416] border rounded-2xl p-3 flex flex-col gap-2 cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 ${
                        isInCart ? 'border-[#e5b83b] ring-1 ring-[#e5b83b]/20' : 'border-neutral-800'
                      }`}
                    >
                      <div className="relative w-full aspect-[4/3] bg-neutral-900 rounded-xl overflow-hidden flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageOff className="w-8 h-8 text-neutral-700" strokeWidth={1.5} />
                        )}
                        {isInCart && (
                          <div className="absolute inset-0 bg-[#0c0c0d]/65 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="w-9 h-9 rounded-full bg-[#e5b83b] flex items-center justify-center text-[#0c0c0d] shadow-lg">
                              <Check className="w-4 h-4" strokeWidth={3} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-semibold text-neutral-200 truncate">{product.name}</span>
                        <span className="text-sm font-bold text-[#e5b83b]">Rs.{priceNum.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>

        {/* Sidebar Cart */}
        <aside className="w-[300px] xl:w-[340px] border-l border-neutral-900 bg-[#0c0c0d] p-5 flex flex-col gap-4 overflow-hidden shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-wide">Active Order</h2>
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-neutral-500 hover:text-[#ef4444] transition-colors p-1.5 rounded-lg hover:bg-neutral-900/50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 gap-2">
                <ShoppingCart className="w-10 h-10" strokeWidth={1.5} />
                <span className="text-sm font-medium">Cart is empty</span>
              </div>
            ) : (
              cart.map((item) => {
                const priceNum = parseFloat(item.product.price);
                const totalItemPrice = priceNum * item.quantity;
                return (
                  <div
                    key={item.product.id}
                    className="group relative flex items-center justify-between p-3 rounded-xl bg-[#141416] border border-neutral-800 hover:border-[#e5b83b]/30 transition-all duration-150"
                  >
                    <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#e5b83b] rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-[#1c1c1e] rounded-lg border border-neutral-800 p-0.5 gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDecreaseQuantity(item.product.id); }}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-[#ef4444] transition-colors text-sm font-bold"
                        >-</button>
                        <span className="text-xs font-bold text-[#e5b83b] w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleIncreaseQuantity(item.product.id); }}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-[#22c55e] transition-colors text-sm font-bold"
                        >+</button>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-white">{item.product.name}</span>
                        {item.note && <span className="text-[11px] text-neutral-500">{item.note}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-neutral-200">Rs.{totalItemPrice.toFixed(2)}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Totals + CTA */}
          <div className="border-t border-neutral-900 pt-4 flex flex-col gap-3">

            {/* Customer fields — takeaway only */}
            {orderType === 'TAKEAWAY' && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Customer name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#141416] border border-neutral-800 focus:border-[#e5b83b]/60 rounded-xl py-2 px-3 text-sm text-white placeholder-neutral-500 outline-none transition-all duration-150"
                />
                <input
                  type="text"
                  placeholder="Phone number (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#141416] border border-neutral-800 focus:border-[#e5b83b]/60 rounded-xl py-2 px-3 text-sm text-white placeholder-neutral-500 outline-none transition-all duration-150"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Subtotal</span>
                <span className="font-semibold text-neutral-200">Rs.{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Tax (8%)</span>
                <span className="font-semibold text-neutral-200">Rs.{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-neutral-900 pt-2 mt-1">
                <span className="text-white">Total</span>
                <span className="text-[#e5b83b] text-xl">Rs.{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleAction}
              disabled={cart.length === 0 || isPlacingOrder}
              className="w-full bg-[#e5b83b] hover:bg-[#f5c847] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-[#0c0c0d] font-bold text-[14px] py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(229,184,59,0.15)] transition-all duration-150"
            >
              {isPlacingOrder ? (
                'Placing Order...'
              ) : orderType === 'DINE_IN' ? (
                <>
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Place Order
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" strokeWidth={2.5} />
                  Checkout
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

  
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={handlePaymentComplete}
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