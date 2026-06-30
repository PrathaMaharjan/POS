"use client";

import { useState, useMemo } from "react";
import { 
  Coffee, Pizza, Check, Wifi, User, Plus, Minus, Trash2, 
  CreditCard, Sparkles, ShoppingCart, RefreshCw, Layers 
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: "all" | "dishes" | "drinks" | "desserts";
  icon: any;
  color: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const PRODUCTS: Product[] = [
  { id: "1", name: "Truffle Pizza", price: 18.00, category: "dishes", icon: Pizza, color: "from-amber-500 to-orange-600" },
  { id: "2", name: "Smoked Wagyu Burger", price: 16.50, category: "dishes", icon: Layers, color: "from-red-500 to-rose-600" },
  { id: "3", name: "Iced Caramel Latte", price: 5.50, category: "drinks", icon: Coffee, color: "from-amber-600 to-amber-900" },
  { id: "4", name: "Matcha Latte", price: 5.00, category: "drinks", icon: Coffee, color: "from-emerald-500 to-teal-700" },
  { id: "5", name: "Avocado Quinoa Salad", price: 12.00, category: "dishes", icon: Layers, color: "from-green-400 to-emerald-600" },
  { id: "6", name: "Warm Chocolate Brownie", price: 6.50, category: "desserts", icon: Sparkles, color: "from-purple-500 to-indigo-700" }
];

export default function TerminalShowcase() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState<"all" | "dishes" | "drinks" | "desserts">("all");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "card" | "qr">("card");

  const filteredProducts = useMemo(() => {
    if (category === "all") return PRODUCTS;
    return PRODUCTS.filter(p => p.category === category);
  }, [category]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cart]);

  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const addToCart = (product: Product) => {
    if (paymentStatus !== "idle") return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    if (paymentStatus !== "idle") return;
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    if (paymentStatus !== "idle") return;
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0 || paymentStatus !== "idle") return;
    setPaymentStatus("processing");
    setTimeout(() => {
      setPaymentStatus("success");
    }, 1500);
  };

  const resetRegister = () => {
    setCart([]);
    setPaymentStatus("idle");
  };

  return (
    <section className="relative bg-black py-24 px-6 md:px-12 border-b border-zinc-900 overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-mono block">
            [ INTERACTIVE DEMO ]
          </span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-white uppercase">
            Test the <span className="font-serif italic font-normal text-zinc-400">Terminal</span> Core
          </h2>
          <p className="text-zinc-400 text-sm md:text-base font-light leading-relaxed">
            Click on items below to build an order, select a payment method, and run a simulated checkout transaction.
          </p>
        </div>

        {/* POS Window Frame */}
        <div className="w-full border border-zinc-800 bg-[#0c0c0d] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:h-[620px]">
          {/* Windows Header Bar */}
          <div className="bg-[#121214] border-b border-zinc-900 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-800" />
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-800" />
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-800" />
              <span className="text-xs font-mono text-zinc-500 ml-4 hidden sm:inline">abstrakt-terminal-v1.0.4.bin</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>alexander.w (Cashier)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <Wifi className="w-3 h-3 animate-pulse" />
                <span>Terminal Online</span>
              </div>
            </div>
          </div>

          {/* POS Main Content */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
            {/* Products Register Area (Left) */}
            <div className="flex-1 p-6 flex flex-col justify-between min-w-0 border-b md:border-b-0 md:border-r border-zinc-900">
              
              {/* Category Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none shrink-0">
                {(["all", "dishes", "drinks", "desserts"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all duration-200 shrink-0 ${
                      category === cat
                        ? "bg-white text-black border-white font-medium"
                        : "bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1 py-1 min-h-[300px]">
                {filteredProducts.map(product => {
                  const Icon = product.icon;
                  const inCartQty = cart.find(item => item.product.id === product.id)?.quantity ?? 0;
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={paymentStatus !== "idle"}
                      className="group relative flex flex-col justify-between p-4 rounded-xl border border-zinc-900 bg-zinc-950 text-left hover:border-zinc-700 hover:bg-zinc-900/60 transition-all duration-200 select-none disabled:opacity-50"
                    >
                      {inCartQty > 0 && (
                        <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-[10px] font-mono font-bold text-black border border-black shadow">
                          {inCartQty}
                        </span>
                      )}
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${product.color} flex items-center justify-center text-white shrink-0 mb-4`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white tracking-wide truncate group-hover:text-emerald-400 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-xs font-mono text-zinc-500 mt-1">
                          Rs. {product.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Billing Cart Drawer (Right) */}
            <div className="w-full md:w-[360px] bg-[#09090a] p-6 flex flex-col justify-between shrink-0">
              
              {/* Cart Items Title */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-900 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Current Cart</h3>
                </div>
                {cart.length > 0 && paymentStatus === "idle" && (
                  <button 
                    onClick={() => setCart([])}
                    className="text-[10px] uppercase tracking-wider font-mono text-rose-500 hover:text-rose-400"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[200px]">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-650 py-10">
                    <ShoppingCart className="w-10 h-10 mb-2 stroke-[1.25]" />
                    <p className="text-xs">Cart is empty</p>
                    <p className="text-[10px] text-zinc-700 mt-1 max-w-[180px]">Select product cards on the left to add items.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center text-xs border border-zinc-900 bg-zinc-950 p-2.5 rounded-lg">
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-white truncate">{item.product.name}</p>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Rs. {(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {paymentStatus === "idle" && (
                          <div className="flex items-center border border-zinc-800 rounded bg-black">
                            <button 
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="p-1 text-zinc-500 hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-1.5 font-mono text-[10px] text-white font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => addToCart(item.product)}
                              className="p-1 text-zinc-500 hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {paymentStatus !== "idle" && (
                          <span className="font-mono text-zinc-400">×{item.quantity}</span>
                        )}
                        {paymentStatus === "idle" && (
                          <button 
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 text-zinc-500 hover:text-rose-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Summary & Payment Button */}
              <div className="border-t border-zinc-900 pt-4 space-y-4 shrink-0">
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>VAT (8%)</span>
                    <span>Rs. {tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-semibold border-t border-zinc-900 pt-2 text-sm">
                    <span>Total Due</span>
                    <span className="text-emerald-400">Rs. {total.toFixed(2)}</span>
                  </div>
                </div>

                {cart.length > 0 && paymentStatus === "idle" && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {(["card", "cash", "qr"] as const).map(method => (
                      <button
                        key={method}
                        onClick={() => setSelectedMethod(method)}
                        className={`py-1.5 text-[10px] font-mono uppercase tracking-wider border rounded transition-colors ${
                          selectedMethod === method
                            ? "bg-zinc-800 border-zinc-700 text-white"
                            : "bg-black border-zinc-900 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                )}

                {paymentStatus === "idle" ? (
                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full font-mono text-xs uppercase tracking-widest font-bold py-3.5 rounded-lg border border-transparent transition-all text-center flex items-center justify-center gap-2 select-none shadow-lg cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-zinc-950 disabled:border-zinc-900 disabled:text-zinc-700 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <CreditCard className="w-4 h-4" />
                    Process Checkout
                  </button>
                ) : paymentStatus === "processing" ? (
                  <div className="w-full font-mono text-xs uppercase tracking-widest font-bold py-3.5 rounded-lg border border-zinc-800 bg-zinc-950 text-amber-500 text-center flex items-center justify-center gap-2 select-none">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executing payment...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-full font-mono text-xs uppercase tracking-widest font-bold py-3.5 rounded-lg border border-transparent bg-emerald-950/40 border-emerald-500/20 text-emerald-400 text-center flex items-center justify-center gap-2 select-none animate-bounce">
                      <Check className="w-4 h-4" />
                      Payment Complete
                    </div>
                    <button
                      onClick={resetRegister}
                      className="w-full font-mono text-[10px] uppercase tracking-widest py-2 bg-zinc-950 text-zinc-500 border border-zinc-900 hover:text-white hover:border-zinc-800 transition-colors text-center rounded-lg"
                    >
                      Open New Ticket
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
