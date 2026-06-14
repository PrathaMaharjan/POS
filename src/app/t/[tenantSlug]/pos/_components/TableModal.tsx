"use client";

import React, { useState, useMemo } from 'react';
import Order, { CreatedOrder } from './order';
import PaymentModal from './PaymentModal';

// 1. Updated Table type to support all relevant statuses
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

interface Table {
  id: number;
  label: string;
  status: TableStatus;
  shape: 'round' | 'square';
  seats: number;
}

interface TableModalProps {
  table: Table;
  tenantSlug: string;
  onClose: () => void;
  onStatusChange?: (tableId: number, newStatus: TableStatus) => void; // Optional callback to lift state up
}

const TABS = ['Add Order', 'Order List', 'Join Table'] as const;
type Tab = typeof TABS[number];

// 2. Map styling profiles for our statuses to keep things visually clean & consistent
const STATUS_META: Record<TableStatus, { bg: string; text: string; dot: string; label: string }> = {
  available: { bg: 'bg-[#22c55e]/10', text: 'text-[#22c55e]', dot: 'bg-[#22c55e]', label: 'Available' },
  occupied: { bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]', dot: 'bg-[#ef4444]', label: 'Occupied' },
  reserved: { bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]', dot: 'bg-[#3b82f6]', label: 'Reserved' },
  cleaning: { bg: 'bg-[#e5b83b]/10', text: 'text-[#e5b83b]', dot: 'bg-[#e5b83b]', label: 'Cleaning' },
};

export default function TableModal({ table, tenantSlug, onClose, onStatusChange }: TableModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Add Order');
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  // 3. Keep local track of current status state
  const [currentStatus, setCurrentStatus] = useState<TableStatus>(table.status);

  const totalTableBalance = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.subtotal, 0);
  }, [orders]);

  const flattenedCartItems = useMemo(() => {
    return orders.flatMap(order => 
      order.items.map(item => ({
        quantity: item.quantity,
        name: item.name,
        price: item.subtotal / item.quantity
      }))
    );
  }, [orders]);

  function handleStatusClick(nextStatus: TableStatus) {
    setCurrentStatus(nextStatus);
    if (onStatusChange) {
      onStatusChange(table.id, nextStatus);
    }
  }

  function handleOrderCreated(newOrder: CreatedOrder) {
    setOrders((prev) => [...prev, newOrder]);
    // Automatically flip the table to occupied when an order is punched
    handleStatusClick('occupied');
    setActiveTab('Order List');
  }

  function handleTableSettlement() {
    setIsPaymentOpen(true);
  }

  function handlePaymentSuccessComplete() {
    setIsPaymentOpen(false);
    setOrders([]);
    // Once fully checked out, mark it for cleaning
    handleStatusClick('cleaning');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0c0c0d] border border-neutral-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 pt-5 pb-4 gap-4 shrink-0 border-b border-neutral-900/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">{table.label}</h2>
              {/* Dynamic Badging Indicator */}
              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${STATUS_META[currentStatus].bg} ${STATUS_META[currentStatus].text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[currentStatus].dot}`} />
                {STATUS_META[currentStatus].label}
              </div>
            </div>
          
          </div>

          {/* Status Quick Action Switcher */}
          <div className="flex items-center gap-1 bg-[#141416] p-1 rounded-xl border border-neutral-800">
            {(Object.keys(STATUS_META) as TableStatus[]).map((statusKey) => {
              const meta = STATUS_META[statusKey];
              const isSelected = currentStatus === statusKey;
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => handleStatusClick(statusKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${
                    isSelected 
                      ? 'bg-neutral-800 text-white shadow-sm' 
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-neutral-800 self-start sm:self-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-6 pt-2 pb-0 border-b border-neutral-800 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all duration-150 border-b-2 -mb-[1px] ${
                activeTab === tab
                  ? 'text-[#e5b83b] border-[#e5b83b] bg-[#e5b83b]/5'
                  : 'text-neutral-500 border-transparent hover:text-neutral-300'
              }`}
            >
              {tab}
              {tab === 'Order List' && orders.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-[#e5b83b] text-[#0c0c0d]">
                  {orders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Content Frame */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'Add Order' && (
            <Order
              tenantSlug={tenantSlug}
              tableId={table.id}
              orderType="DINE_IN"
              showHeader={false}
              onOrderCreated={handleOrderCreated}
            />
          )}

          {activeTab === 'Order List' && (
            <div className="h-full flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {orders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-3">
                    <svg className="w-12 h-12 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3m8 11v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4M3 8h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
                    </svg>
                    <p className="text-sm">No pending items found for {table.label}</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-[#141416] border border-neutral-800 rounded-xl p-4">
                      <div className="flex justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold text-sm">Order #{order.orderNumber}</h3>
                          <p className="text-[11px] text-neutral-500">{new Date(order.createdAt).toLocaleString()}</p>
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
                    </div>
                  ))
                )}
              </div>

              {orders.length > 0 && (
                <div className="bg-[#141416] border-t border-neutral-800 p-5 flex items-center justify-between gap-6 shrink-0">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase font-semibold text-neutral-500 tracking-wider">Unsettled Balance</span>
                    <span className="text-xl font-black text-white">
                      Rs. {totalTableBalance.toFixed(2)} <span className="text-xs text-neutral-400 font-normal">(Before Taxes)</span>
                    </span>
                  </div>
                  <button
                    onClick={handleTableSettlement}
                    className="bg-[#e5b83b] hover:bg-[#f5c847] active:scale-[0.98] text-[#0c0c0d] font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-150 shadow-[0_4px_20px_rgba(229,184,59,0.1)]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                    Process Table Payment
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Join Table' && (
            <div className="h-full p-6 flex flex-col gap-4 overflow-y-auto">
              <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase">Merge with another table</p>
              <p className="text-sm text-neutral-500">Select a table to join with {table.label}:</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {['T-01', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07'].map((t) => (
                  <button key={t} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-neutral-800 bg-[#141416] hover:border-[#e5b83b]/60 hover:bg-[#e5b83b]/5 transition-all duration-150">
                    <svg className="w-6 h-6 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 18v3M20 18v3M3 8h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8zM12 14v4M8 18h8"/>
                    </svg>
                    <span className="text-sm font-semibold text-white">{t}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <PaymentModal 
        isOpen={isPaymentOpen}
        onClose={handlePaymentSuccessComplete}
        totalAmount={totalTableBalance}
        orderType="DINE_IN"
        tableId={table.label}
        cart={flattenedCartItems}
      />
    </div>
  );
}