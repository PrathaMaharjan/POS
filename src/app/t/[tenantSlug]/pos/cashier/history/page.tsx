"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, MessageSquare } from 'lucide-react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

type OrderStatus = 'COMPLETED' | 'CANCELLED' | 'PENDING';
type PaymentMethod = 'CASH' | 'CARD' | 'FONEPAY' | 'QR' | 'UNPAID';
type OrderType = 'TAKEAWAY' | 'DINE_IN';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  type: OrderType;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  tableId?: string | null;
  tableName?: string | null;
  createdAt: string;
}

interface HistoryProps {
  tenantSlug: string;
  role?: 'cashier' | 'waiter';
}

const STATUS_STYLES_DARK: Record<OrderStatus, { label: string; dot: string; text: string; bg: string }> = {
  COMPLETED: { label: 'Completed', dot: 'bg-[#22c55e]', text: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10 border-[#22c55e]/20' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-[#ef4444]', text: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10 border-[#ef4444]/20' },
  PENDING: { label: 'Pending', dot: 'bg-[#e5b83b]', text: 'text-[#e5b83b]', bg: 'bg-[#e5b83b]/10 border-[#e5b83b]/20' },
};

const STATUS_STYLES_LIGHT: Record<OrderStatus, { label: string; dot: string; text: string; bg: string }> = {
  COMPLETED: { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  PENDING: { label: 'Pending', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
};

function getPaymentBadge(method: string | undefined, isDark: boolean): { label: string; color: string } {
  switch (method?.toUpperCase()) {
    case 'CASH':
      return { 
        label: 'Cash Payment', 
        color: isDark 
          ? 'text-neutral-300 bg-neutral-900/50 border border-neutral-800 px-2 py-0.5 rounded-md text-[11px]' 
          : 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-semibold' 
      };
    case 'CARD':
      return { 
        label: 'Card Payment', 
        color: isDark 
          ? 'text-neutral-300 bg-neutral-900/50 border border-neutral-800 px-2 py-0.5 rounded-md text-[11px]' 
          : 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-semibold' 
      };
    case 'FONEPAY':
    case 'QR':
      return { 
        label: 'QR Payment', 
        color: isDark 
          ? 'text-neutral-300 bg-[#e5b83b]/10 border border-[#e5b83b]/20 px-2 py-0.5 rounded-md text-[11px]' 
          : 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-semibold' 
      };
    default:
      return { 
        label: 'Unpaid Shift', 
        color: isDark 
          ? 'text-neutral-500 bg-neutral-900/20 border border-neutral-900 px-2 py-0.5 rounded-md text-[11px] font-semibold' 
          : 'text-emerald-600 bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded-md text-[11px] font-semibold' 
      };
  }
}

function formatTime(iso: string): string {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function HistoryInner({ tenantSlug: propTenantSlug, role = 'cashier' }: HistoryProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const router = useRouter();
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = propTenantSlug || params?.tenantSlug;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.get('/orders');
        const dbOrders = res.data.orders ?? [];
        const mapped: Order[] = dbOrders.map((o: any) => {
          const firstPayment = o.payments?.[0];
          const paymentMethod = firstPayment?.method?.toUpperCase() ?? 'UNPAID';

          const mappedItems: OrderItem[] = (o.items ?? []).map((item: any) => ({
            name: item.product?.name ?? item.name ?? 'Unknown Item',
            quantity: item.quantity,
            price: Number(item.unitPrice),
            notes: item.notes ?? item.note ?? '',
          }));

          return {
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status.toUpperCase() as OrderStatus,
            type: o.orderType === 'takeaway' ? 'TAKEAWAY' : 'DINE_IN',
            paymentMethod: paymentMethod as PaymentMethod,
            items: mappedItems,
            subtotal: Number(o.subtotal),
            tax: Number(o.tax),
            total: Number(o.total),
            tableId: o.tableId,
            tableName: o.table?.name ?? o.table?.tableNumber ?? null,
            createdAt: o.createdAt,
          };
        });
        setOrders(mapped);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load order history.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const orderNum = String(o.orderNumber || o.id);
      const matchesSearch =
        orderNum.includes(search) ||
        o.items.some(i => i.name.toLowerCase().includes(search.toLowerCase())) ||
        o.items.some(i => i.notes?.toLowerCase().includes(search.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const handleSearch = (v: string) => { setSearch(v); setCurrentPage(1); };
  const handleStatusFilter = (v: string) => { setStatusFilter(v); setCurrentPage(1); };

  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === 'COMPLETED');
    const pending = orders.filter(o => o.status === 'PENDING');
    return {
      total: orders.length,
      revenue: completed.reduce((s, o) => s + o.total, 0),
      completed: completed.length,
      pending: pending.length,
    };
  }, [orders]);

  const handleGoBack = () => {
    if (role === 'waiter') {
      router.push(`/t/${tenantSlug}/pos/waiter`);
    } else {
      router.push(`/t/${tenantSlug}/pos/cashier`);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-200 ${isDark ? "bg-[#0c0c0d] text-[#e4e4e7]" : "bg-slate-50 text-slate-800"
      }`}>
      <main className="flex-1 px-10 py-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">

        {/* Top Header Panel */}
        {isDark ? (
          <div className="flex items-center justify-between flex-wrap gap-4 rounded-2xl p-5 border bg-[#141416] border-neutral-800 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Order History</h1>
              <p className="text-sm text-neutral-500 mt-0.5">All orders from today's shift</p>
            </div>
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 bg-[#141416] border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-4 rounded-2xl p-5 border bg-[#059669] border-[#047857] text-white shadow-sm">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Order History</h1>
              <p className="text-sm mt-0.5 text-emerald-100">All orders from today's shift</p>
            </div>
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border bg-emerald-700 hover:bg-emerald-800 border-emerald-600 text-white hover:text-emerald-100 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats.total, color: isDark ? 'text-white' : 'text-slate-800', barColor: isDark ? 'bg-[#e5b83b]' : 'bg-slate-400' },
            { label: 'Revenue', value: `Rs.${stats.revenue.toFixed(2)}`, color: isDark ? 'text-[#e5b83b]' : 'text-emerald-600', barColor: isDark ? 'bg-[#e5b83b]' : 'bg-emerald-500' },
            { label: 'Completed', value: stats.completed, color: isDark ? 'text-[#22c55e]' : 'text-emerald-600', barColor: isDark ? 'bg-[#e5b83b]' : 'bg-emerald-500' },
            { label: 'Pending', value: stats.pending, color: isDark ? 'text-[#e5b83b]' : 'text-amber-500', barColor: isDark ? 'bg-[#e5b83b]' : 'bg-amber-500' },
          ].map(s => (
            <div key={s.label} className={`border rounded-2xl p-5 relative overflow-hidden shadow-sm transition-all ${
              isDark ? "bg-[#141416] border-neutral-800" : "bg-white border-slate-200"
            }`}>
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl ${s.barColor}`} />
              <p className={`text-[10px] font-bold tracking-widest uppercase ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search order #, item, or notes..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className={`w-full focus:ring-1 focus:ring-opacity-50 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all border ${isDark
                  ? "bg-[#141416] border-neutral-800 focus:border-[#e5b83b]/60 text-white placeholder-neutral-500"
                  : "bg-white border-slate-200 focus:border-emerald-500/60 focus:ring-emerald-500/30 text-slate-800 placeholder-slate-400 shadow-sm"
                }`}
            />
          </div>

          <div className="flex gap-2">
            {(['ALL', 'COMPLETED', 'PENDING', 'CANCELLED'] as const).map(s => (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 border ${statusFilter === s
                    ? isDark
                      ? 'bg-[#e5b83b] border-[#e5b83b] text-[#0c0c0d]'
                      : 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : isDark
                      ? 'bg-[#141416] text-neutral-400 border-neutral-800 hover:text-white'
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-850 hover:bg-slate-50 shadow-sm'
                  }`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-600 gap-3">
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-[#e5b83b]' : 'text-emerald-600'}`} />
              <p className="text-sm font-medium">Loading history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-600 gap-2">
              <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-sm font-medium">No orders found</p>
            </div>
          ) : (
            paginatedOrders.map(order => {
              const s = isDark ? STATUS_STYLES_DARK[order.status] : STATUS_STYLES_LIGHT[order.status];
              const isExpanded = expandedId === order.id;
              const paymentBadge = getPaymentBadge(order.paymentMethod, isDark);

              return (
                <div
                  key={order.id}
                  className={`border rounded-2xl overflow-hidden transition-all duration-200 shadow-sm group ${isDark
                      ? "bg-[#141416] border-neutral-800 hover:border-neutral-700"
                      : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                >
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${isDark ? "bg-[#0c0c0d] border-neutral-800" : "bg-slate-50 border-slate-200"
                        }`}>
                        <span className={`text-xs font-bold ${isDark ? "text-[#e5b83b]" : "text-emerald-600"}`}>#{order.orderNumber}</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className={`text-[15px] font-bold tracking-wide ${isDark ? "text-white" : "text-slate-800"}`}>
                          {order.items.length > 0 ? order.items.map(i => i.name).join(', ') : 'Empty Order'}
                        </span>
                        <div className={`flex items-center gap-2 text-xs font-medium flex-wrap ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                          <span>{formatDate(order.createdAt)} · {formatTime(order.createdAt)}</span>
                          <span className="opacity-55">•</span>
                          <span>
                            {order.type === 'TAKEAWAY'
                              ? 'Takeaway'
                              : `Dine-in · ${order.tableName || order.tableId || 'Table --'}`}
                          </span>
                          <span className="opacity-55">•</span>
                          <span className={paymentBadge.color}>{paymentBadge.label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                      <span className={`text-base font-bold w-24 text-right ${isDark ? "text-white" : "text-slate-800"}`}>
                        Rs.{order.total.toFixed(2)}
                      </span>

                      <svg
                        className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={`border-t px-5 py-4 transition-all duration-150 ${isDark ? "border-neutral-800 bg-[#0f0f10]" : "border-slate-100 bg-slate-50/50"
                      }`}>
                      <div className="flex gap-8 flex-wrap md:flex-nowrap">
                        <div className="flex-1 min-w-[250px]">
                          <p className={`text-[10px] font-bold tracking-widest uppercase mb-3 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>Items</p>
                          <div className="flex flex-col gap-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className={`flex flex-col gap-1 text-sm border-b pb-2 last:border-0 last:pb-0 ${isDark ? "border-neutral-900/40" : "border-slate-100"
                                }`}>
                                <div className="flex justify-between">
                                  <span className={`font-medium ${isDark ? "text-neutral-300" : "text-slate-700"}`}>{item.quantity}x {item.name}</span>
                                  <span className={isDark ? "text-neutral-400" : "text-slate-500"}>Rs.{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                {item.notes && (
                                  <div className={`flex items-start gap-1.5 text-xs px-2.5 py-1 rounded-lg mt-1 border self-start max-w-full ${isDark
                                      ? "text-[#e5b83b]/90 bg-[#e5b83b]/5 border-[#e5b83b]/10"
                                      : "text-amber-800 bg-amber-50 border-amber-200"
                                    }`}>
                                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                                    <span className="italic">{item.notes}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-48 ml-auto">
                          <p className={`text-[10px] font-bold tracking-widest uppercase mb-3 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>Summary</p>
                          <div className="flex flex-col gap-1.5 text-sm">
                            <div className={`flex justify-between ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                              <span>Subtotal</span>
                              <span>Rs.{order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className={`flex justify-between ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                              <span>Tax (8%)</span>
                              <span>Rs.{order.tax.toFixed(2)}</span>
                            </div>
                            <div className={`flex justify-between font-bold border-t pt-1.5 mt-1 ${isDark ? "text-white border-neutral-800" : "text-slate-800 border-slate-200"
                              }`}>
                              <span>Total</span>
                              <span className={isDark ? "text-[#e5b83b]" : "text-emerald-600"}>Rs.{order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {filtered.length > 0 && (
          <div className={`flex items-center justify-between border-t pt-4 mt-2 ${isDark ? "border-neutral-900" : "border-slate-200"}`}>
            <p className={`text-xs font-medium ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
              Showing{' '}
              <span className={isDark ? "text-neutral-300" : "text-slate-700"}>{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}</span>
              {' '}to{' '}
              <span className={isDark ? "text-neutral-300" : "text-slate-700"}>{Math.min(filtered.length, currentPage * itemsPerPage)}</span>
              {' '}of{' '}
              <span className={isDark ? "text-[#e5b83b]" : "text-emerald-600 font-bold"}>{filtered.length}</span> entries
            </p>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={`p-2 border rounded-xl disabled:opacity-30 transition-colors ${isDark
                    ? "bg-[#141416] border-neutral-800 text-neutral-400 hover:text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
                  }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[36px] h-9 rounded-xl text-xs font-bold transition-all duration-150 border ${currentPage === page
                      ? isDark
                        ? 'bg-[#e5b83b] border-[#e5b83b] text-[#0c0c0d]'
                        : 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : isDark
                        ? 'bg-[#141416] border-neutral-800 text-neutral-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 shadow-sm'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={`p-2 border rounded-xl disabled:opacity-30 transition-colors ${isDark
                    ? "bg-[#141416] border-neutral-800 text-neutral-400 hover:text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
                  }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function History(props: HistoryProps) {
  return (
    <ThemeProvider role="cashier">
      <HistoryInner {...props} />
    </ThemeProvider>
  );
}