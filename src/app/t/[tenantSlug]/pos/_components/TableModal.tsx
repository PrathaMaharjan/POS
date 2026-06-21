"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Order, { CreatedOrder } from './order';
import PaymentModal from './PaymentModal';
import api from '@/lib/api';
import {
  X,
  ClipboardList,
  CreditCard,
  TableProperties,
  CheckCircle2,
  Loader2,
  Trash2, // Added Trash2 icon for deletion
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
}

const TABS = ['Add Order', 'Order List'] as const;
type Tab = typeof TABS[number];

const STATUS_META: Record<TableStatus, { bg: string; text: string; dot: string; label: string }> = {
  available: { bg: 'bg-[#22c55e]/10', text: 'text-[#22c55e]', dot: 'bg-[#22c55e]', label: 'Available' },
  occupied: { bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]', dot: 'bg-[#ef4444]', label: 'Occupied' },
  reserved: { bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]', dot: 'bg-[#3b82f6]', label: 'Reserved' },
  dirty: { bg: 'bg-[#e5b83b]/10', text: 'text-[#e5b83b]', dot: 'bg-[#e5b83b]', label: 'Cleaning' },
};

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  'Add Order': <ClipboardList className="w-4 h-4" />,
  'Order List': <CheckCircle2 className="w-4 h-4" />
};

export default function TableModal({ table, tenantSlug, role, onClose, onStatusChange, onKotStatusChange }: TableModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Add Order');
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState<Record<string, boolean>>({});
  const [currentStatus, setCurrentStatus] = useState<TableStatus>(table.status);
  const [rawOrderData, setRawOrderData] = useState<any[]>([]);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTableOrder(silent = false) {
      try {
        if (!silent) setIsLoadingOrders(true);
        setError(null);
        const res = await api.get(`/orders/${table.id}`);
        const data = res.data;
        if (data && data.orders && data.orders.length > 0) {
          setRawOrderData(data.orders);
          const mappedOrders = data.orders.map((dbOrder: any) => {
            const mappedOrder: CreatedOrder = {
              id: dbOrder.id,
              orderNumber: String(dbOrder.orderNumber),
              tableId: dbOrder.tableId,
              status: dbOrder.status.toUpperCase() as 'PENDING',
              total: Number(dbOrder.total),
              subtotal: Number(dbOrder.subtotal),
              createdAt: dbOrder.createdAt,
              items: (dbOrder.items ?? []).map((item: any) => ({
                quantity: item.quantity,
                name: item.product?.name ?? 'Unknown Item',
                subtotal: Number(item.subtotal),
              })),
            };

            const totalTickets = dbOrder.kotTickets ?? [];
            const isFullyServed = totalTickets.length > 0 && totalTickets.every((t: any) => t.status === 'served');

            if (isFullyServed) {
              setDeliveredOrders(prev => ({ ...prev, [dbOrder.id]: true }));
            }

            return mappedOrder;
          });
          setOrders(mappedOrders);
        } else {
          setOrders([]);
          setRawOrderData([]);
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

  const totalTableBalance = useMemo(() =>
    orders.reduce((sum, order) => {
      const orderSub = order.subtotal > 0 ? order.subtotal : order.items.reduce((itemSum, item) => itemSum + item.subtotal, 0);
      return sum + orderSub;
    }, 0),
    [orders]
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
    setOrders(prev => [...prev, newOrder]);
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
    setDeliveredOrders({});
    handleStatusClick('dirty');
    onClose();
  }


  async function deleteOrder(orderId: string) {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    setIsDeletingId(orderId);
    try {
      await api.delete(`/orders/${orderId}`);


      setOrders(prev => prev.filter(o => o.id !== orderId));
      setRawOrderData(prev => prev.filter(o => o.id !== orderId));


      if (orders.length <= 1) {
        handleStatusClick('available');
      }
    } catch (err) {
      console.error("Failed to cancel/delete order card:", err);
      alert("Could not remove order. Check role authorization levels.");
    } finally {
      setIsDeletingId(null);
    }
  }

  async function toggleDelivery(orderId: string) {
  const isCurrentlyDelivered = !!deliveredOrders[orderId];
  const newDeliveredState = !isCurrentlyDelivered;

  setDeliveredOrders(prev => ({ ...prev, [orderId]: newDeliveredState }));

  try {
    const currentOrder = rawOrderData.find((o: any) => o.id === orderId);
    if (currentOrder && currentOrder.kotTickets) {
      const nextStatus = newDeliveredState ? 'served' : 'ready';
      
      // 1. Update all tickets on the server concurrently and wait for completion
      await Promise.all(
        currentOrder.kotTickets.map((ticket: any) =>
          api.patch(`/kot/${ticket.id}`, { status: nextStatus })
        )
      );

      // 2. Once server updates succeed, update local status and trigger parent notification
      for (const ticket of currentOrder.kotTickets) {
        ticket.status = nextStatus;
        onKotStatusChange?.(ticket.id, nextStatus);
      }
    }
  } catch (err) {
    console.error("Failed to update status from TableModal:", err);
    setDeliveredOrders(prev => ({ ...prev, [orderId]: isCurrentlyDelivered }));
  }
}

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0c0c0d] border border-neutral-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 pt-5 pb-4 gap-4 shrink-0 border-b border-neutral-900/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">{table.label}</h2>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${STATUS_META[currentStatus].bg} ${STATUS_META[currentStatus].text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[currentStatus].dot}`} />
              {STATUS_META[currentStatus].label}
            </div>
          </div>

          {/* Status switcher */}
          <div className="flex items-center gap-1 bg-[#141416] p-1 rounded-xl border border-neutral-800">
            {(Object.keys(STATUS_META) as TableStatus[]).map((statusKey) => {
              const meta = STATUS_META[statusKey];
              const isSelected = currentStatus === statusKey;
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => handleStatusClick(statusKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${isSelected
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-neutral-800 self-start sm:self-center"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-6 pt-2 pb-0 border-b border-neutral-800 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all duration-150 border-b-2 -mb-[1px] ${activeTab === tab
                ? 'text-[#e5b83b] border-[#e5b83b] bg-[#e5b83b]/5'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
                }`}
            >
              {TAB_ICONS[tab]}
              {tab}
              {tab === 'Order List' && orders.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-[#e5b83b] text-[#0c0c0d]">
                  {orders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
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
                    <Loader2 className="w-8 h-8 animate-spin text-[#e5b83b]" />
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
                    const showDeliveryButton = role !== 'waiter' || isFoodReady || isDelivered;

                    const hasPreparing = tickets.some((t: any) => t.status === 'preparing');
                    const hasPending = tickets.some((t: any) => t.status === 'pending');
                    const isDeleting = isDeletingId === order.id;

                    return (
                      <div key={order.id} className="bg-[#141416] border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-semibold text-sm">Order #{order.orderNumber}</h3>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isDelivered
                                ? 'bg-neutral-900 border-neutral-800 text-neutral-500'
                                : 'bg-[#e5b83b]/10 border-[#e5b83b]/20 text-[#e5b83b]'
                                }`}>
                                {isDelivered ? 'Delivered' : 'Pending Delivery'}
                              </span>

<button
  type="button"
  disabled={isDeleting}
  onClick={() => deleteOrder(order.id)}
  className="ml-1 p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-40"
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
                          <span className="text-[#e5b83b] text-sm font-bold">Rs.{order.total.toFixed(2)}</span>
                        </div>

                        <div className="space-y-2 border-t border-neutral-900/50 pt-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-neutral-400">{item.quantity} × {item.name}</span>
                              <span className="text-neutral-200">Rs.{item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-neutral-900/40 flex justify-end">
                          {role !== 'cashier' && showDeliveryButton ? (
                            <button
                              type="button"
                              onClick={() => toggleDelivery(order.id)}
                              className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-1.5 rounded-lg transition-colors border ${isDelivered
                                ? 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900'
                                : 'bg-[#e5b83b] border-transparent text-[#0c0c0d] hover:bg-[#f5c847]'
                                }`}
                            >
                              {isDelivered ? 'Mark Undelivered' : 'Mark Delivered'}
                            </button>
                          ) : (
                            role === 'cashier' && isDelivered ? null : (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1.5 rounded-lg border border-neutral-900 bg-neutral-950/20 text-neutral-500">
                                <span className={`w-1.5 h-1.5 rounded-full ${hasPreparing ? 'bg-blue-500 animate-pulse' : 'bg-[#e5b83b]/60'}`} />
                                Kitchen: {hasPreparing ? 'Preparing' : (hasPending ? 'Pending' : 'Queueing')}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {orders.length > 0 && (
                <div className="bg-[#141416] border-t border-neutral-800 p-5 flex items-center justify-between gap-6 shrink-0">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase font-semibold text-neutral-500 tracking-wider">Unsettled Balance</span>
                    <span className="text-xl font-black text-white">
                      Rs. {totalTableBalance.toFixed(2)}{' '}
                      <span className="text-xs text-neutral-400 font-normal">(Before Taxes)</span>
                    </span>
                  </div>
                  <button
                    onClick={handleTableSettlement}
                    disabled={!allOrdersDelivered}
                    className={`font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-150 select-none ${allOrdersDelivered
                      ? 'bg-[#e5b83b] hover:bg-[#f5c847] text-[#0c0c0d] active:scale-[0.98] shadow-[0_4px_20px_rgba(229,184,59,0.1)] cursor-pointer'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed opacity-60'
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
        orderId={orders[0]?.id}
        ordersList={orders}
        totalAmount={totalTableBalance}
        orderType="DINE_IN"
        tableId={table.label}
        cart={flattenedCartItems}
      />
    </div>
  );
}