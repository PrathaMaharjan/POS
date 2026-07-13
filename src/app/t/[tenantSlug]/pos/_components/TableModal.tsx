"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Order, { CreatedOrder } from './order';
import PaymentModal from './PaymentModal';
import api from '@/lib/api';
import { useTheme } from '../context/ThemeContext';
import {
  X,
  ClipboardList,
  CreditCard,
  TableProperties,
  CheckCircle2,
  Loader2,
  Trash2,
  Banknote,
  Smartphone,
} from 'lucide-react';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'dirty';

interface Table {
  id: string;
  label: string;
  status: TableStatus;
  shape: 'round' | 'square';
  seats: number;
}

interface TableModalProps {
  table: Table;
  tenantSlug: string;
  role?: 'cashier' | 'waiter';
  onClose: () => void;
  onStatusChange?: (tableId: string, newStatus: TableStatus) => void;
  onKotStatusChange?: (ticketId: string, nextStatus: string) => void;
  skipKitchenWorkflow?: boolean;
}

const TABS = ['Add Order', 'Order List'] as const;
type Tab = typeof TABS[number];

const STATUS_META_DARK: Record<TableStatus, { bg: string; text: string; dot: string; label: string }> = {
  available: { bg: 'bg-[#22c55e]/10', text: 'text-[#22c55e]', dot: 'bg-[#22c55e]', label: 'Available' },
  occupied: { bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]', dot: 'bg-[#ef4444]', label: 'Occupied' },
  reserved: { bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]', dot: 'bg-[#3b82f6]', label: 'Reserved' },
  dirty: { bg: 'bg-[#e5b83b]/10', text: 'text-[#e5b83b]', dot: 'bg-[#e5b83b]', label: 'Cleaning' },
};

const STATUS_META_LIGHT: Record<TableStatus, { bg: string; text: string; dot: string; label: string }> = {
  available: { bg: 'bg-emerald-50 border border-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Available' },
  occupied: { bg: 'bg-amber-50 border border-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Occupied' },
  reserved: { bg: 'bg-blue-50 border border-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Reserved' },
  dirty: { bg: 'bg-slate-100 border border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Cleaning' },
};

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  'Add Order': <ClipboardList className="w-4 h-4" />,
  'Order List': <CheckCircle2 className="w-4 h-4" />
};

interface PaymentStatusItem {
  orderItemId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  paidQty: number;
  unpaidQty: number;
  fullyPaid: boolean;
}

// ── UPDATED — now carries taxRate, snapshotted on the order itself ──
interface PaymentStatus {
  status: string;
  taxRate: number;
  items: PaymentStatusItem[];
}

type PayMethod = 'cash' | 'card' | 'qr';

interface PayingItemInfo {
  orderId: string;
  orderItemId: string;
  itemName: string;
  unpaidQty: number;
  unitPrice: number;
}

// ── NEW — one record per successful partial payment, tracked
//    client-side for this table session, so we can tell the
//    final PaymentModal receipt what was ACTUALLY collected
//    (it has no other way of knowing — its own settlement flow
//    only ever sees the REMAINING balance, which becomes 0 once
//    everything was already paid off individually) ──
interface PaymentRecord {
  itemName: string;
  quantity: number;
  method: PayMethod;
  total: number;
}

export default function TableModal({ table, tenantSlug, role, onClose, onStatusChange, onKotStatusChange }: TableModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<Tab>('Add Order');
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState<Record<string, boolean>>({});
  const [currentStatus, setCurrentStatus] = useState<TableStatus>(table.status);
  const [rawOrderData, setRawOrderData] = useState<any[]>([]);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [deleteOrderConfirmId, setDeleteOrderConfirmId] = useState<string | null>(null);

  const [paymentStatusMap, setPaymentStatusMap] = useState<Record<string, PaymentStatus | 'error'>>({});

  const [payingItem, setPayingItem] = useState<PayingItemInfo | null>(null);
  const [payQty, setPayQty] = useState(1);
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // ── NEW — running history of every partial payment made this
  //    session, so the final receipt isn't blank once the table
  //    is fully settled via individual item payments ──
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    async function fetchTableOrder(silent = false) {
      try {
        if (!silent) setIsLoadingOrders(true);
        setError(null);

        const [res, kotRes] = await Promise.all([
          api.get(`/orders/${table.id}`),
          api.get('/kot')
        ]);

        const allKotTickets = kotRes.data.tickets ?? [];
        const data = res.data;

        if (data && data.orders && data.orders.length > 0) {
          const uniqueRawOrders = data.orders.filter(
            (o: any, idx: number, self: any[]) => self.findIndex((item) => item.id === o.id) === idx
          );

          const enrichedOrders = uniqueRawOrders.map((o: any) => {
            const relatedKots = (o.kotTickets ?? []).map((dbTicket: any) => {
              const fullTicket = allKotTickets.find((t: any) => t.id === dbTicket.id);
              return fullTicket ? { ...fullTicket, orderId: o.id } : { ...dbTicket, items: [] };
            });
            return { ...o, kotTickets: relatedKots };
          });

          setRawOrderData(prevRaw => {
            const newIds = new Set(enrichedOrders.map((o: any) => o.id));
            const stillMissing = prevRaw.filter((o: any) => !newIds.has(o.id));
            return [...enrichedOrders, ...stillMissing];
          });

          Promise.all(
            uniqueRawOrders.map((o: any) =>
              api.get(`/orders/${o.id}/partial-payment`)
                .then((r) => [o.id, r.data] as const)
                .catch((err) => {
                  console.error(`[partial-payment] order ${o.id} FAILED:`, err.response?.status, err.response?.data ?? err.message);
                  return [o.id, 'error'] as const;
                })
            )
          ).then((results) => {
            setPaymentStatusMap((prev) => {
              const next = { ...prev };
              for (const [orderId, status] of results) {
                next[orderId] = status;
              }
              return next;
            });
          });

          const initialDeliveredStates: Record<string, boolean> = {};

          const mappedOrders = enrichedOrders.map((dbOrder: any) => {
            const mappedOrder: CreatedOrder = {
              id: dbOrder.id,
              orderNumber: String(dbOrder.orderNumber),
              tableId: dbOrder.tableId,
              status: dbOrder.status.toUpperCase() as 'PENDING',
              total: Number(dbOrder.total),
              subtotal: Number(dbOrder.subtotal),
              createdAt: dbOrder.createdAt,
              items: (dbOrder.items ?? []).map((item: any) => {
                const baseName = item.product?.name ?? 'Unknown Item';
                return {
                  quantity: item.quantity,
                  name: item.variantLabel ? `${baseName} (${item.variantLabel})` : baseName,
                  subtotal: Number(item.subtotal),
                };
              }),
            };

            const totalTickets = dbOrder.kotTickets ?? [];

            (mappedOrder.items ?? []).forEach(item => {
              const itemTicket = totalTickets.find((t: any) =>
                (t.items ?? []).some((ki: any) => {
                  const oi = ki.orderItem ?? {};
                  const kiBase = oi.product?.name ?? ki.product?.name ?? oi.name ?? ki.name ?? '';
                  const kiName = oi.variantLabel ? `${kiBase} (${oi.variantLabel})` : kiBase;
                  return kiName === item.name;
                })
              );
              const itemKi = itemTicket
                ? (itemTicket.items ?? []).find((ki: any) => {
                  const oi = ki.orderItem ?? {};
                  const kiBase = oi.product?.name ?? ki.product?.name ?? oi.name ?? ki.name ?? '';
                  const kiName = oi.variantLabel ? `${kiBase} (${oi.variantLabel})` : kiBase;
                  return kiName === item.name;
                })
                : null;

              // ── FIX — was reading localStorage FIRST (isLocalDelivered),
              //    which could carry stale "true" values from a previous
              //    session/order reuse and silently mark the whole order
              //    "DELIVERED" even though nobody clicked anything and the
              //    live KOT status still correctly says "ready". Now this
              //    is derived PURELY from live backend KOT status — the
              //    only way this becomes true is a real toggleDelivery()
              //    click, which actually PATCHes the ticket to 'served'. ──
              const isItemServed = itemKi
                ? (itemKi.status === 'served' || itemTicket?.status === 'served')
                : (itemTicket ? itemTicket.status === 'served' : false);
              initialDeliveredStates[`item_${dbOrder.id}_${item.name}`] = isItemServed;
            });

            const allItems = mappedOrder.items ?? [];
            const isFullyServed = allItems.length === 0 || allItems.every(item => initialDeliveredStates[`item_${dbOrder.id}_${item.name}`]);

            if (isFullyServed) {
              initialDeliveredStates[dbOrder.id] = true;
            }

            return mappedOrder;
          });

          setOrders(prevOrders => {
            const newIds = new Set(mappedOrders.map((o: CreatedOrder) => o.id));
            const stillMissing = prevOrders.filter(o => !newIds.has(o.id));
            return [...mappedOrders, ...stillMissing];
          });

          setDeliveredOrders(prev => ({ ...prev, ...initialDeliveredStates }));
        }
      } catch (err) {
        console.error('Failed to fetch table orders:', err);
        if (!silent) setError('Failed to load existing orders.');
      } finally {
        if (!silent) setIsLoadingOrders(false);
      }
    }

    fetchTableOrder();
    const interval = setInterval(() => fetchTableOrder(true), 5000);
    return () => clearInterval(interval);
  }, [table.id]);

  const remainingBalanceByOrder = useMemo(() => {
    const map: Record<string, number> = {};
    for (const order of orders) {
      const status = paymentStatusMap[order.id];
      if (status && status !== 'error') {
        map[order.id] = status.items.reduce((s, i) => s + i.unitPrice * i.unpaidQty, 0);
      } else {
        map[order.id] = order.subtotal > 0
          ? order.subtotal
          : order.items.reduce((s, i) => s + i.subtotal, 0);
      }
    }
    return map;
  }, [orders, paymentStatusMap]);

  const totalTableBalance = useMemo(() =>
    orders.reduce((sum, order) => sum + (remainingBalanceByOrder[order.id] ?? 0), 0),
    [orders, remainingBalanceByOrder]
  );

  const ordersForFinalSettlement = useMemo(() =>
    orders
      .filter(order => (remainingBalanceByOrder[order.id] ?? 0) > 0)
      .map(order => ({
        ...order,
        total: remainingBalanceByOrder[order.id],
        subtotal: remainingBalanceByOrder[order.id],
      })),
    [orders, remainingBalanceByOrder]
  );

  const flattenedCartItems = useMemo(() =>
    orders.flatMap(order =>
      order.items.map(item => ({
        quantity: item.quantity,
        name: item.name,
        price: item.subtotal / item.quantity,
      }))
    ),
    [orders]
  );

  const allOrdersDelivered = useMemo(() => {
    if (orders.length === 0) return false;
    return orders.every(order => !!deliveredOrders[order.id]);
  }, [orders, deliveredOrders]);

  function handleStatusClick(nextStatus: TableStatus) {
    setCurrentStatus(nextStatus);
    onStatusChange?.(table.id, nextStatus);
  }

  function handleOrderCreated(newOrder: CreatedOrder) {
    setOrders(prev => {
      if (prev.some(o => o.id === newOrder.id)) return prev;
      return [...prev, newOrder];
    });
    handleStatusClick('occupied');
    setActiveTab('Order List');
  }

  function handleTableSettlement() {
    if (!allOrdersDelivered) return;
    setIsPaymentOpen(true);
  }

  function handlePaymentSuccessComplete() {
    setIsPaymentOpen(false);
    setOrders([]);
    setRawOrderData([]);
    setDeliveredOrders({});
    setPaymentStatusMap({});
    setPaymentHistory([]); // ← reset once the table is fully closed out
    handleStatusClick('dirty');
    onClose();
  }

  async function deleteOrder(orderId: string) {
    setIsDeletingId(orderId);
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setRawOrderData(prev => prev.filter(o => o.id !== orderId));
      setPaymentStatusMap(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      if (orders.length <= 1) {
        handleStatusClick('available');
      }
    } catch (err) {
      console.error("Failed to cancel/delete order card:", err);
      alert("Could not remove order. Check role authorization levels.");
    } finally {
      setIsDeletingId(null);
      setDeleteOrderConfirmId(null);
    }
  }

  async function toggleDelivery(orderId: string) {
    const isCurrentlyDelivered = !!deliveredOrders[orderId];
    const newDeliveredState = !isCurrentlyDelivered;

    setDeliveredOrders(prev => ({ ...prev, [orderId]: newDeliveredState }));

    try {
      const currentOrder = rawOrderData.find((o: any) => o.id === orderId);
      if (currentOrder) {
        const mappedOrder = orders.find(o => o.id === orderId);
        if (mappedOrder) {
          mappedOrder.items.forEach(item => {
            setDeliveredOrders(prev => ({ ...prev, [`item_${orderId}_${item.name}`]: newDeliveredState }));
          });
        }

        if (currentOrder.kotTickets) {
          const nextStatus = newDeliveredState ? 'served' : 'ready';

          await Promise.all(
            currentOrder.kotTickets.map((ticket: any) =>
              api.patch(`/kot/${ticket.id}`, { status: nextStatus })
            )
          );

          for (const ticket of currentOrder.kotTickets) {
            ticket.status = nextStatus;
            onKotStatusChange?.(ticket.id, nextStatus);
          }
        }
      }
    } catch (err) {
      console.error("Failed to update status from TableModal:", err);
      setDeliveredOrders(prev => ({ ...prev, [orderId]: isCurrentlyDelivered }));
    }
  }

  function openPayPopup(orderId: string, orderItemId: string, itemName: string, unpaidQty: number, unitPrice: number) {
    setPayingItem({ orderId, orderItemId, itemName, unpaidQty, unitPrice });
    setPayQty(1);
    setPayMethod('cash');
  }

  function closePayPopup() {
    setPayingItem(null);
    setPayQty(1);
    setPayMethod('cash');
  }

  // ── UPDATED — now also takes itemName/unitPrice/taxRate so it can
  //    build a PaymentRecord after success, in addition to the
  //    already-computed tax-inclusive amountTendered ──
  async function handlePayItem(
    orderId: string,
    orderItemId: string,
    quantity: number,
    method: PayMethod,
    amountTendered: number,
    itemName: string,
  ) {
    const status = paymentStatusMap[orderId];
    if (!status || status === 'error') return;
    const item = status.items.find(i => i.orderItemId === orderItemId);
    if (!item) return;

    setIsSubmittingPayment(true);
    try {
      const res = await api.post(`/orders/${orderId}/partial-payment`, {
        method,
        items: [{ orderItemId, quantity }],
        amountTendered,
      });

      setPaymentStatusMap(prev => {
        const current = prev[orderId];
        if (!current || current === 'error') return prev;

        const updatedItems = current.items.map(i =>
          i.orderItemId === orderItemId
            ? {
              ...i,
              paidQty: i.paidQty + quantity,
              unpaidQty: i.unpaidQty - quantity,
              fullyPaid: i.paidQty + quantity >= i.quantity,
            }
            : i
        );

        return {
          ...prev,
          [orderId]: {
            ...current,
            status: res.data.orderFullyPaid ? 'completed' : current.status,
            items: updatedItems,
          },
        };
      });

      // ── NEW — record this payment so the final receipt can
      //    show what was actually collected, even if the whole
      //    table ends up fully settled via item-level payments ──
      setPaymentHistory(prev => [
        ...prev,
        { itemName, quantity, method, total: amountTendered },
      ]);

      closePayPopup();
    } catch (err: any) {
      console.error("Failed to record partial payment:", err);
      alert(err.response?.data?.error ?? "Payment failed. Please try again.");
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  const statusMeta = isDark ? STATUS_META_DARK[currentStatus] : STATUS_META_LIGHT[currentStatus];

  // ── NEW — tax breakdown for the currently open pay popup.
  //    Mirrors createPartialPayment's EXACT rounding
  //    (round to 2dp on the tax figure, then round the total)
  //    so amountTendered always matches what the backend expects,
  //    never off by a paisa/cent. ──
  const payPopupTaxRate = payingItem
    ? (() => {
      const status = paymentStatusMap[payingItem.orderId];
      return status && status !== 'error' ? status.taxRate : 0;
    })()
    : 0;
  const payPopupSubtotal = payingItem ? payingItem.unitPrice * payQty : 0;
  const payPopupTax = Math.round(payPopupSubtotal * (payPopupTaxRate / 100) * 100) / 100;
  const payPopupTotal = Math.round((payPopupSubtotal + payPopupTax) * 100) / 100;

  // ── NEW — summary of everything paid this session, handed to
  //    PaymentModal so its "already fully settled" receipt shows
  //    the REAL collected total (and per-payment breakdown)
  //    instead of Rs. 0.00 across the board ──
  const alreadyPaidSummary = useMemo(() => {
    if (paymentHistory.length === 0) return null;
    return {
      items: paymentHistory.map(r => ({
        itemName: r.itemName,
        quantity: r.quantity,
        method: r.method as string,
        total: r.total,
      })),
      total: paymentHistory.reduce((sum, r) => sum + r.total, 0),
    };
  }, [paymentHistory]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className={`w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${isDark ? "bg-[#0c0c0d] border-neutral-800 text-white" : "bg-white border-slate-200 text-slate-800"
        }`}>

        <div className={`flex flex-col sm:flex-row sm:items-center justify-between px-6 pt-5 pb-4 gap-4 shrink-0 border-b ${isDark ? "border-neutral-900/50" : "border-slate-100"
          }`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-800"}`}>{table.label}</h2>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusMeta.bg} ${statusMeta.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </div>
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? "bg-[#141416] border-neutral-800" : "bg-slate-100 border-slate-200"
            }`}>
            {(Object.keys(isDark ? STATUS_META_DARK : STATUS_META_LIGHT) as TableStatus[]).map((statusKey) => {
              const meta = isDark ? STATUS_META_DARK[statusKey] : STATUS_META_LIGHT[statusKey];
              const isSelected = currentStatus === statusKey;
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => handleStatusClick(statusKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${isSelected
                    ? isDark ? 'bg-neutral-800 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                    : isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className={`transition-colors p-2 rounded-lg self-start sm:self-center ${isDark ? "text-neutral-500 hover:text-white hover:bg-neutral-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className={`flex items-center gap-1 px-6 pt-2 pb-0 border-b shrink-0 ${isDark ? "border-neutral-800" : "border-slate-200 bg-slate-50/50"
          }`}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all duration-150 border-b-2 -mb-[1px] ${isSelected
                  ? isDark
                    ? 'text-[#e5b83b] border-[#e5b83b] bg-[#e5b83b]/5'
                    : 'text-emerald-600 border-emerald-600 bg-emerald-50/45'
                  : isDark
                    ? 'text-neutral-500 border-transparent hover:text-neutral-300'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                  }`}
              >
                {TAB_ICONS[tab]}
                {tab}
                {tab === 'Order List' && orders.length > 0 && (
                  <span className={`ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${isDark ? 'bg-[#e5b83b] text-[#0c0c0d]' : 'bg-emerald-600 text-white'
                    }`}>
                    {orders.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-hidden">

          {activeTab === 'Add Order' && (
            <Order
              tenantSlug={tenantSlug}
              tableId={table.id}
              orderType="DINE_IN"
              showHeader={false}
              role={role}
              onOrderCreated={handleOrderCreated}
            />
          )}

          {activeTab === 'Order List' && (
            <div className="h-full flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingOrders ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-3">
                    <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-[#e5b83b]' : 'text-emerald-600'}`} />
                    <p className="text-sm">Loading order list...</p>
                  </div>
                ) : error ? (
                  <div className="h-full flex flex-col items-center justify-center text-red-500 gap-3">
                    <p className="text-sm">{error}</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-3">
                    <ClipboardList className="w-12 h-12" strokeWidth={1.5} />
                    <p className="text-sm">No pending items found for {table.label}</p>
                  </div>
                ) : (
                  orders.map((order) => {
                    const isDelivered = !!deliveredOrders[order.id];
                    const rawOrder = rawOrderData.find((o: any) => o.id === order.id);
                    const tickets = rawOrder?.kotTickets ?? [];
                    const isFoodReady = tickets.length > 0 && tickets.every((t: any) => t.status === 'ready' || t.status === 'served');

                    const hasPreparing = tickets.some((t: any) => t.status === 'preparing');
                    const hasPending = tickets.some((t: any) => t.status === 'pending');
                    const isDeleting = isDeletingId === order.id;

                    const orderPaymentStatus = paymentStatusMap[order.id];

                    return (
                      <div key={order.id} className={`border rounded-xl p-4 flex flex-col gap-3 ${isDark ? "bg-[#141416] border-neutral-800" : "bg-slate-50 border-slate-200"
                        }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>Order #{order.orderNumber}</h3>

                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteOrderConfirmId(order.id)}
                                className={`ml-1 p-1 rounded-md transition-all duration-150 disabled:opacity-40 ${isDark ? 'text-neutral-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  }`}
                                title="Cancel Order"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={`text-sm font-bold ${isDark ? 'text-[#e5b83b]' : 'text-slate-800'}`}>Rs.{order.total.toFixed(2)}</span>
                        </div>

                        <div className={`space-y-2 border-t pt-2 ${isDark ? "border-neutral-900/50" : "border-slate-200"}`}>
                          {order.items.map((item, idx) => {
                            // ── FIX — was falling back to localStorage here too,
                            //    same stale-data risk as the initial fetch.
                            //    deliveredOrders is now always correctly seeded
                            //    from live KOT status, so just read it directly. ──
                            const isItemDelivered = deliveredOrders[`item_${order.id}_${item.name}`] ?? false;

                            const itemTicket = tickets.find((t: any) =>
                              (t.items ?? []).some((ki: any) => {
                                const oi = ki.orderItem ?? {};
                                // ── FIX — was missing the variant label here,
                                //    so ANY variant product ("Orange Juice (50ml)")
                                //    never matched its own KOT item ("Orange Juice"),
                                //    leaving status stuck on "Pending" and hiding
                                //    the Pay item button entirely for variants ──
                                const kiBase = oi.product?.name ?? ki.product?.name ?? oi.name ?? ki.name ?? '';
                                const kiName = oi.variantLabel ? `${kiBase} (${oi.variantLabel})` : kiBase;
                                return kiName === item.name;
                              })
                            );
                            const itemKi = itemTicket
                              ? (itemTicket.items ?? []).find((ki: any) => {
                                const oi = ki.orderItem ?? {};
                                const kiBase = oi.product?.name ?? ki.product?.name ?? oi.name ?? ki.name ?? '';
                                const kiName = oi.variantLabel ? `${kiBase} (${oi.variantLabel})` : kiBase;
                                return kiName === item.name;
                              })
                              : null;
                            const kotItemId = itemKi?.id;
                            const itemTicketStatus = itemTicket ? itemTicket.status?.toLowerCase() : 'pending';
                            const dbItemStatus = itemKi ? itemKi.status?.toLowerCase() : itemTicketStatus;
                            const itemStatus = (itemTicketStatus === 'ready' || itemTicketStatus === 'served') ? itemTicketStatus : dbItemStatus;

                            const isReadyToDeliver = itemStatus === 'ready' || itemStatus === 'served';

                            const orderItem = itemKi?.orderItem ?? {};
                            const orderItemId: string | null = orderItem.id ?? null;
                            const paymentStatusItem = (orderItemId && orderPaymentStatus && orderPaymentStatus !== 'error')
                              ? orderPaymentStatus.items.find(i => i.orderItemId === orderItemId)
                              : undefined;
                            const isItemFullyPaid = paymentStatusItem?.fullyPaid ?? false;

                            const handleToggleItemDelivery = async (e: React.MouseEvent) => {
                              e.stopPropagation();
                              const nextDelivered = !isItemDelivered;

                              try {
                                if (kotItemId) {
                                  const nextTicketStatus = nextDelivered ? 'served' : 'ready';
                                  await api.patch(`/kot/singlekot/${kotItemId}`, { status: nextTicketStatus });
                                  if (itemKi) itemKi.status = nextTicketStatus;
                                  if (itemTicket) {
                                    onKotStatusChange?.(itemTicket.id, nextTicketStatus);
                                  }
                                } else if (itemTicket) {
                                  const nextTicketStatus = nextDelivered ? 'served' : 'ready';
                                  await api.patch(`/kot/${itemTicket.id}`, { status: nextTicketStatus });
                                  itemTicket.status = nextTicketStatus;
                                  onKotStatusChange?.(itemTicket.id, nextTicketStatus);
                                }

                                setDeliveredOrders(prev => {
                                  const updated = { ...prev, [`item_${order.id}_${item.name}`]: nextDelivered };

                                  const allItems = order.items;
                                  const allDelivered = allItems.every((it) =>
                                    updated[`item_${order.id}_${it.name}`] === true
                                  );

                                  updated[order.id] = allDelivered;
                                  return updated;
                                });
                              } catch (err) {
                                console.error("Failed to update item ticket status:", err);
                                alert("Failed to update item status. Please check your role permissions or connection.");
                              }
                            };

                            return (
                              <div key={idx} className="flex justify-between items-center text-xs py-1.5 gap-4">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={isDark ? "text-neutral-400 shrink-0" : "text-slate-500 shrink-0"}>
                                    {paymentStatusItem ? paymentStatusItem.unpaidQty : item.quantity} ×
                                  </span>
                                  <span className={`font-medium truncate ${isDark ? "text-neutral-200" : "text-slate-700"} ${isItemFullyPaid ? "line-through opacity-50" : ""}`}>
                                    {item.name}
                                  </span>

                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${itemStatus === 'served'
                                    ? 'bg-neutral-800 border-transparent text-[#a1a1aa]'
                                    : itemStatus === 'ready'
                                      ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                      : itemStatus === 'preparing' || itemStatus === 'processing'
                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                    }`}>
                                    {itemStatus === 'served' ? 'Delivered' : itemStatus === 'ready' ? 'Ready' : itemStatus === 'preparing' || itemStatus === 'processing' ? 'Preparing' : 'Pending'}
                                  </span>
                                </div>

                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  <span className={`font-bold ${isItemFullyPaid ? "line-through opacity-50" : ""} ${isDark ? "text-neutral-250" : "text-slate-800"}`}>
                                    Rs.{(paymentStatusItem ? paymentStatusItem.unpaidQty * paymentStatusItem.unitPrice : item.subtotal).toFixed(2)}
                                  </span>

                                  {orderItemId && isReadyToDeliver && !isItemFullyPaid && paymentStatusItem && (
                                    <button
                                      type="button"
                                      onClick={() => openPayPopup(order.id, orderItemId, item.name, paymentStatusItem.unpaidQty, paymentStatusItem.unitPrice)}
                                      className={`text-[9px] font-bold uppercase tracking-wide underline ${isDark ? "text-[#e5b83b] hover:text-[#f5c847]" : "text-emerald-600 hover:text-emerald-700"}`}
                                    >
                                      Pay item ({paymentStatusItem.unpaidQty} left)
                                    </button>
                                  )}

                                  {isItemFullyPaid && (
                                    <span className="text-[9px] font-bold text-emerald-500">✓ Paid</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className={`pt-2 border-t flex items-center justify-between gap-2 ${isDark ? "border-neutral-900/40" : "border-slate-200"}`}>
                          <div>
                            {!isDelivered && (
                              <div className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1.5 rounded-lg border ${isDark ? "border-neutral-900 bg-neutral-950/20 text-neutral-500" : "border-slate-200 bg-slate-100 text-slate-500"
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isFoodReady
                                  ? 'bg-[#f97316]'
                                  : hasPreparing
                                    ? 'bg-blue-500 animate-pulse'
                                    : 'bg-amber-500'
                                  }`} />
                                Kitchen: {isFoodReady ? 'Ready' : (hasPreparing ? 'Preparing' : (hasPending ? 'Pending' : 'Queueing'))}
                              </div>
                            )}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => toggleDelivery(order.id)}
                              disabled={!isFoodReady && !isDelivered}
                              className={`text-[10px] font-extrabold tracking-wide uppercase px-3 py-1.5 rounded-lg transition-colors border select-none ${isDelivered
                                ? isDark
                                  ? 'border-emerald-800/40 text-emerald-400 bg-emerald-500/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25 cursor-pointer'
                                  : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer'
                                : !isFoodReady
                                  ? isDark
                                    ? 'bg-neutral-850 border-neutral-800/50 text-neutral-500 cursor-not-allowed opacity-50'
                                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                  : isDark
                                    ? 'bg-[#e5b83b] border-transparent text-[#0c0c0d] hover:bg-[#f5c847] cursor-pointer'
                                    : 'bg-emerald-600 border-transparent text-white hover:bg-emerald-700 cursor-pointer'
                                }`}
                            >
                              {isDelivered ? 'Delivered' : 'Deliver Order'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {orders.length > 0 && (
                <div className={`border-t p-5 flex items-center justify-between gap-6 shrink-0 ${isDark ? "bg-[#141416] border-neutral-800" : "bg-white border-slate-200"
                  }`}>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase font-semibold text-neutral-500 tracking-wider">Unsettled Balance</span>
                    <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Rs. {totalTableBalance.toFixed(2)}{' '}
                      <span className={`text-xs font-normal ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}>(Before Taxes)</span>
                    </span>
                  </div>
                  <button
                    onClick={handleTableSettlement}
                    disabled={!allOrdersDelivered}
                    className={`font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-150 select-none ${allOrdersDelivered
                      ? isDark
                        ? 'bg-[#e5b83b] hover:bg-[#f5c847] text-[#0c0c0d] active:scale-[0.98] shadow-[0_4px_20px_rgba(229,184,59,0.1)] cursor-pointer'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98] shadow-sm cursor-pointer'
                      : isDark
                        ? 'bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed opacity-60'
                        : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      }`}
                  >
                    <CreditCard className="w-4 h-4" strokeWidth={2.5} />
                    Process Table Payment
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={handlePaymentSuccessComplete}
        orderId={ordersForFinalSettlement[0]?.id}
        ordersList={ordersForFinalSettlement}
        totalAmount={totalTableBalance}
        orderType="DINE_IN"
        tableId={table.label}
        cart={flattenedCartItems}
        alreadyPaidSummary={alreadyPaidSummary}
      />

      {deleteOrderConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-xl border p-6 flex flex-col gap-4 transition-all duration-200 ${isDark ? "bg-[#141416] border-neutral-800 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500"
                }`}>
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Cancel Order?</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                  This will permanently remove the order.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setDeleteOrderConfirmId(null)}
                disabled={isDeletingId !== null}
                className={`flex-1 font-bold py-2.5 rounded-xl transition-all duration-150 text-xs border ${isDark
                  ? 'border-neutral-800 text-neutral-400 bg-transparent hover:bg-neutral-800 hover:text-white'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-650'
                  }`}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => deleteOrder(deleteOrderConfirmId)}
                disabled={isDeletingId !== null}
                className={`flex-1 font-bold py-2.5 rounded-xl transition-all duration-150 text-xs flex items-center justify-center gap-1.5 ${isDark
                  ? 'bg-red-500 hover:bg-red-650 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
              >
                {isDeletingId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {payingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-xl border p-6 flex flex-col gap-5 transition-all duration-200 ${isDark ? "bg-[#141416] border-neutral-800 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Pay for item</h3>
                <p className={`text-xs mt-0.5 truncate max-w-[220px] ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                  {payingItem.itemName}
                </p>
              </div>
              <button
                type="button"
                onClick={closePayPopup}
                disabled={isSubmittingPayment}
                className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${isDark ? "text-neutral-500 hover:text-white hover:bg-neutral-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-slate-400"}`}>
                Quantity ({payingItem.unpaidQty} unpaid)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPayQty(q => Math.max(1, q - 1))}
                  disabled={isSubmittingPayment}
                  className={`w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center border transition-colors disabled:opacity-40 ${isDark ? "border-neutral-800 text-neutral-300 hover:bg-neutral-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={payingItem.unpaidQty}
                  value={payQty}
                  onChange={(e) =>
                    setPayQty(Math.min(Math.max(1, Number(e.target.value) || 1), payingItem.unpaidQty))
                  }
                  disabled={isSubmittingPayment}
                  className={`flex-1 text-center text-lg font-bold rounded-lg px-3 py-2 border outline-none transition-colors ${isDark
                    ? "bg-[#0c0c0d] border-neutral-800 text-white focus:border-[#e5b83b]"
                    : "bg-white border-slate-200 text-slate-800 focus:border-emerald-500"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setPayQty(q => Math.min(payingItem.unpaidQty, q + 1))}
                  disabled={isSubmittingPayment}
                  className={`w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center border transition-colors disabled:opacity-40 ${isDark ? "border-neutral-800 text-neutral-300 hover:bg-neutral-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-slate-400"}`}>
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'cash' as const, label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
                  { id: 'card' as const, label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
                  { id: 'qr' as const, label: 'QR', icon: <Smartphone className="w-4 h-4" /> },
                ]).map(({ id, label, icon }) => {
                  const isSelected = payMethod === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={isSubmittingPayment}
                      onClick={() => setPayMethod(id)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 flex flex-col items-center justify-center gap-1 disabled:opacity-40 ${isSelected
                        ? isDark
                          ? 'bg-[#e5b83b] text-[#0c0c0d] border-[#e5b83b]'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : isDark
                          ? 'bg-[#0c0c0d] text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'
                        }`}
                    >
                      <span className={isSelected ? (isDark ? 'text-[#0c0c0d]' : 'text-white') : (isDark ? 'text-[#e5b83b]' : 'text-emerald-600')}>
                        {icon}
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── UPDATED — was a single "Amount" row, now a full
                 Subtotal / Tax / Total breakdown, matching PaymentModal's
                 summary card style for consistency ── */}
            <div className={`rounded-xl p-4 space-y-2 border ${isDark ? "bg-[#0c0c0d] border-neutral-900" : "bg-slate-50 border-slate-200"
              }`}>
              <div className={`flex justify-between text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                <span>Subtotal</span>
                <span className={isDark ? "" : "font-medium"}>Rs.{payPopupSubtotal.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                <span>Tax ({payPopupTaxRate}%)</span>
                <span className={isDark ? "" : "font-medium"}>Rs.{payPopupTax.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-bold border-t pt-2 mt-1 ${isDark ? "text-white border-neutral-800" : "text-slate-800 border-slate-200"
                }`}>
                <span>Total Due</span>
                <span className={`text-lg ${isDark ? "text-[#e5b83b]" : "text-emerald-600"}`}>Rs.{payPopupTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closePayPopup}
                disabled={isSubmittingPayment}
                className={`flex-1 font-bold py-2.5 rounded-xl transition-all duration-150 text-sm border disabled:opacity-50 ${isDark
                  ? 'border-neutral-800 text-neutral-400 bg-transparent hover:bg-neutral-800 hover:text-white'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-650'
                  }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePayItem(payingItem.orderId, payingItem.orderItemId, payQty, payMethod, payPopupTotal, payingItem.itemName)}
                disabled={isSubmittingPayment}
                className={`flex-1 font-bold py-2.5 rounded-xl transition-all duration-150 text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${isDark
                  ? "bg-[#e5b83b] hover:bg-[#f5c847] text-[#0c0c0d]"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  }`}
              >
                {isSubmittingPayment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}