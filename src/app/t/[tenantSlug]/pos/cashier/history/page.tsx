"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, MessageSquare } from 'lucide-react';

type OrderStatus = 'COMPLETED' | 'CANCELLED' | 'PENDING';
type PaymentMethod = 'CASH' | 'CARD' | 'FONEPAY' | 'QR' | 'UNPAID';
type OrderType = 'TAKEAWAY' | 'DINE_IN';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string; // Captures item level kitchen instructions
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

const STATUS_STYLES: Record<OrderStatus, { label: string; dot: string; text: string; bg: string }> = {
  COMPLETED: { label: 'Completed', dot: 'bg-[#22c55e]', text: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10 border-[#22c55e]/20' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-[#ef4444]', text: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10 border-[#ef4444]/20' },
  PENDING: { label: 'Pending', dot: 'bg-[#e5b83b]', text: 'text-[#e5b83b]', bg: 'bg-[#e5b83b]/10 border-[#e5b83b]/20' },
};

function getPaymentBadge(method: string | undefined): { label: string; color: string } {
  switch (method?.toUpperCase()) {
    case 'CASH':
      return { label: 'Cash Payment', color: 'text-neutral-300 bg-neutral-900/50 border border-neutral-800 px-2 py-0.5 rounded-md text-[11px]' };
    case 'CARD':
      return { label: 'Card Payment', color: 'text-neutral-300 bg-neutral-900/50 border border-neutral-800 px-2 py-0.5 rounded-md text-[11px]' };
    case 'FONEPAY':
    case 'QR':
      return { label: 'QR Payment', color: 'text-neutral-300 bg-[#e5b83b]/10 border border-[#e5b83b]/20 px-2 py-0.5 rounded-md text-[11px]' };
    default:
      return { label: 'Unpaid Shift', color: 'text-neutral-500 bg-neutral-900/20 border border-neutral-900 px-2 py-0.5 rounded-md text-[11px] font-semibold' };
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

export default function History({ tenantSlug: propTenantSlug, role = 'cashier' }: HistoryProps) {
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
    <div className="min-h-screen bg-[#0c0c0d] text-[#e4e4e7] flex flex-col font-sans select-none antialiased">
      <main className="flex-1 px-10 py-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">

        <div className="flex items-center justify-between">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats.total, color: 'text-white' },
            { label: 'Revenue', value: `Rs.${stats.revenue.toFixed(2)}`, color: 'text-[#e5b83b]' },
            { label: 'Completed', value: stats.completed, color: 'text-[#22c55e]' },
            { label: 'Pending', value: stats.pending, color: 'text-[#e5b83b]' },
          ].map(s => (
            <div key={s.label} className="bg-[#141416] border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#e5b83b] rounded-l-2xl" />
              <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">{s.label}</p>
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
              className="w-full bg-[#141416] border border-neutral-800 focus:border-[#e5b83b]/60 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-neutral-500 outline-none transition-all"
            />
          </div>

          <div className="flex gap-2">
            {(['ALL', 'COMPLETED', 'PENDING', 'CANCELLED'] as const).map(s => (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${statusFilter === s
                    ? 'bg-[#e5b83b] text-[#0c0c0d]'
                    : 'bg-[#141416] text-neutral-400 border border-neutral-800 hover:text-white'
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
              <Loader2 className="w-8 h-8 animate-spin text-[#e5b83b]" />
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
              const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
              const isExpanded = expandedId === order.id;
              const paymentBadge = getPaymentBadge(order.paymentMethod);

              return (
                <div
                  key={order.id}
                  className="bg-[#141416] border border-neutral-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-neutral-700 group"
                >
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#0c0c0d] border border-neutral-800 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#e5b83b]">#{order.orderNumber}</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[15px] font-bold text-white tracking-wide">
                          {order.items.length > 0 ? order.items.map(i => i.name).join(', ') : 'Empty Order'}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium flex-wrap">
                          <span>{formatDate(order.createdAt)} · {formatTime(order.createdAt)}</span>
                          <span className="text-neutral-700">•</span>
                          <span>
                            {order.type === 'TAKEAWAY'
                              ? 'Takeaway'
                              : `Dine-in · ${order.tableName || order.tableId || 'Table --'}`}
                          </span>
                          <span className="text-neutral-700">•</span>
                          <span className={paymentBadge.color}>{paymentBadge.label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                      <span className="text-base font-bold text-white w-24 text-right">
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
                    <div className="border-t border-neutral-800 px-5 py-4 bg-[#0f0f10]">
                      <div className="flex gap-8 flex-wrap md:flex-nowrap">
                        <div className="flex-1 min-w-[250px]">
                          <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-3">Items</p>
                          <div className="flex flex-col gap-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex flex-col gap-1 text-sm border-b border-neutral-900/40 pb-2 last:border-0 last:pb-0">
                                <div className="flex justify-between">
                                  <span className="text-neutral-300 font-medium">{item.quantity}x {item.name}</span>
                                  <span className="text-neutral-400">Rs.{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                {item.notes && (
                                  <div className="flex items-start gap-1.5 text-xs text-[#e5b83b]/90 bg-[#e5b83b]/5 px-2.5 py-1 rounded-lg mt-1 border border-[#e5b83b]/10 self-start max-w-full">
                                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#e5b83b]/70" />
                                    <span className="italic">{item.notes}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-48 ml-auto">
                          <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-3">Summary</p>
                          <div className="flex flex-col gap-1.5 text-sm">
                            <div className="flex justify-between text-neutral-400">
                              <span>Subtotal</span>
                              <span>Rs.{order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                              <span>Tax (8%)</span>
                              <span>Rs.{order.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-white border-t border-neutral-800 pt-1.5 mt-1">
                              <span>Total</span>
                              <span className="text-[#e5b83b]">Rs.{order.total.toFixed(2)}</span>
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
          <div className="flex items-center justify-between border-t border-neutral-900 pt-4 mt-2">
            <p className="text-xs text-neutral-500 font-medium">
              Showing{' '}
              <span className="text-neutral-300">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}</span>
              {' '}to{' '}
              <span className="text-neutral-300">{Math.min(filtered.length, currentPage * itemsPerPage)}</span>
              {' '}of{' '}
              <span className="text-[#e5b83b]">{filtered.length}</span> entries
            </p>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 bg-[#141416] border border-neutral-800 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[36px] h-9 rounded-xl text-xs font-bold transition-all duration-150 border ${currentPage === page
                      ? 'bg-[#e5b83b] border-[#e5b83b] text-[#0c0c0d]'
                      : 'bg-[#141416] border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 bg-[#141416] border border-neutral-800 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
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