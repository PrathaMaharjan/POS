"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type TicketState = 'PENDING' | 'PREPARING' | 'DONE';
type OrderType = 'TAKEAWAY' | 'DINE_IN';

interface KitchenItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface KitchenOrder {
  id: string;
  orderNumber: number;
  type: OrderType;
  tableName?: string | null;
  items: KitchenItem[];
  minutesElapsed: number;
  ticketState: TicketState;
}

const ROTATIONS = [
  '-rotate-[0.8deg]',
  'rotate-[0.5deg]',
  '-rotate-[1.2deg]',
  'rotate-[0.9deg]',
  '-rotate-[0.4deg]',
  'rotate-[1.1deg]',
  '-rotate-[0.6deg]',
];

const getRotationClass = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ROTATIONS.length;
  return ROTATIONS[index];
};

const COLUMNS: { state: TicketState; label: string; headerBg: string; countBg: string }[] = [
  {
    state: 'PENDING',
    label: 'New Orders',
    headerBg: 'bg-[#e5b83b]/8 border-[#e5b83b]/15',
    countBg: 'bg-[#e5b83b]/15 text-[#e5b83b] border-[#e5b83b]/25',
  },
  {
    state: 'PREPARING',
    label: 'Preparing',
    headerBg: 'bg-blue-500/8 border-blue-500/15',
    countBg: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  },
  {
    state: 'DONE',
    label: 'Ready to Serve',
    headerBg: 'bg-[#22c55e]/8 border-[#22c55e]/15',
    countBg: 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/25',
  },
];

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

function OrderModal({ order, onClose, onPreparing, onDone }: {
  order: KitchenOrder;
  onClose: () => void;
  onPreparing: (id: string) => void;
  onDone: (id: string) => void;
}) {
  const isUrgent = order.minutesElapsed >= 10;
  const label = order.type === 'TAKEAWAY' ? 'Take away' : order.tableName;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#1c1c1f] rounded-2xl border border-[#3f3f46] w-full max-w-sm mx-4 overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className={`px-5 pt-4 pb-3.5 border-b border-[#27272a] ${
          order.ticketState === 'DONE'
            ? 'bg-[#22c55e]/15'
            : order.ticketState === 'PREPARING'
            ? 'bg-blue-500/15'
            : isUrgent
            ? 'bg-red-500/15'
            : 'bg-[#27272a]/60'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-black text-white">#{order.orderNumber}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                order.type === 'TAKEAWAY'
                  ? 'bg-[#e5b83b]/10 text-[#e5b83b] border-[#e5b83b]/25'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
              }`}>
                {label}
              </span>
              <span className={`text-[11px] font-bold ${isUrgent ? 'text-red-400' : 'text-[#52525b]'}`}>
                {isUrgent ? `⚠ ${order.minutesElapsed}m` : `${order.minutesElapsed}m`}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#27272a] text-[#71717a] hover:text-white transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 flex flex-col">
          {order.items.map((item, idx, arr) => (
            <React.Fragment key={idx}>
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="text-[13px] font-semibold text-[#d4d4d8] flex-1">{item.name}</span>
                {item.notes && (
                  <span className="text-[11px] text-red-400 italic">{item.notes}</span>
                )}
                <span className="text-[12px] font-bold text-[#a1a1aa] bg-[#27272a] border border-[#3f3f46] rounded px-2 py-0.5 ml-2 flex-shrink-0">
                  x{item.quantity}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div className="border-t border-dashed border-[#2e2e32]" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="px-5 pb-5 pt-2 flex gap-2">
          {order.ticketState === 'DONE' ? (
            <button
              onClick={() => { onDone(order.id); onClose(); }}
              className="flex-1 py-2.5 rounded-xl bg-[#22c55e]/10 hover:bg-red-500/10 border border-[#22c55e]/30 hover:border-red-500/30 text-[#4ade80] hover:text-red-400 text-[12px] font-bold text-center transition-all group flex items-center justify-center gap-1"
            >
              <span className="group-hover:hidden">✓ Done</span>
              <span className="hidden group-hover:inline flex items-center gap-1">
                <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                Undo Move
              </span>
            </button>
          ) : (
            <>
              <button
                onClick={() => { onPreparing(order.id); onClose(); }}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-[0.97] ${
                  order.ticketState === 'PREPARING'
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#27272a] border border-[#3f3f46] text-[#a1a1aa] hover:bg-[#3f3f46]'
                }`}
              >
                {order.ticketState === 'PREPARING' ? '● Preparing' : 'Start Preparing'}
              </button>
              <button
                onClick={() => { onDone(order.id); onClose(); }}
                className="flex-1 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-[#0a1a0f] text-[12px] font-bold transition-all active:scale-[0.97]"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketCard({
  order,
  onPreparing,
  onDone,
  onOpen,
}: {
  order: KitchenOrder;
  onPreparing: (id: string) => void;
  onDone: (id: string) => void;
  onOpen: () => void;
}) {
  const isUrgent = order.minutesElapsed >= 10;
  const label = order.type === 'TAKEAWAY' ? 'Take away' : order.tableName;
  const rotation = getRotationClass(order.id);

  const stickyBg =
    order.ticketState === 'DONE'
      ? 'bg-[#1a2e1f]'
      : order.ticketState === 'PREPARING'
      ? 'bg-[#17213a]'
      : isUrgent
      ? 'bg-[#2a1a1a]'
      : 'bg-[#21201a]';

  const tapeBg =
    order.ticketState === 'DONE'
      ? 'bg-[#22c55e]/30'
      : order.ticketState === 'PREPARING'
      ? 'bg-blue-500/30'
      : isUrgent
      ? 'bg-red-500/30'
      : 'bg-[#e5b83b]/20';

  return (
    <div
      className={`${stickyBg} ${rotation} rounded-sm shadow-[2px_4px_16px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-transform hover:scale-[1.02] hover:rotate-0 cursor-pointer h-full`}
      onClick={onOpen}
    >
      {/* Tape strip */}
      <div className={`h-2 w-full ${tapeBg}`} />

      {/* Shimmer for preparing */}
      {order.ticketState === 'PREPARING' && (
        <div className="h-0.5 w-full bg-[#1e2a3a] overflow-hidden relative">
          <div
            className="h-full bg-blue-400/70 absolute top-0 left-0"
            style={{ width: '45%', animation: 'shimmer 1.8s ease-in-out infinite' }}
          />
        </div>
      )}

      {/* Header */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-black text-white">#{order.orderNumber}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
              order.type === 'TAKEAWAY'
                ? 'bg-[#e5b83b]/10 text-[#e5b83b] border-[#e5b83b]/25'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
            }`}>
              {label}
            </span>
          </div>
          <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-400' : 'text-[#52525b]'}`}>
            {isUrgent ? `⚠ ${order.minutesElapsed}m` : `${order.minutesElapsed}m`}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-3.5 py-2 flex flex-col flex-1 overflow-hidden">
        {order.items.slice(0, 3).map((item, idx, arr) => (
          <React.Fragment key={idx}>
            <div className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-[11px] font-semibold text-[#c4c4c8] flex-1 leading-tight">{item.name}</span>
              {item.notes && (
                <span className="text-[9px] text-red-400 italic truncate max-w-[70px]">{item.notes}</span>
              )}
              <span className="text-[10px] font-bold text-[#71717a] bg-black/20 border border-white/10 rounded px-1.5 py-0.5 ml-1 flex-shrink-0">
                x{item.quantity}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <div className="border-t border-dashed border-white/8 mx-1" />
            )}
          </React.Fragment>
        ))}
        {order.items.length > 3 && (
          <p className="text-[10px] text-[#52525b] mt-auto pt-1">+{order.items.length - 3} more — tap to view</p>
        )}
      </div>

      {/* Buttons */}
      <div
        className="px-3 pb-3 pt-1 mt-auto flex gap-2"
        onClick={e => e.stopPropagation()}
      >
        {order.ticketState === 'DONE' ? (
          <button
            onClick={() => onDone(order.id)}
            className="flex-1 py-1.5 rounded-lg bg-[#22c55e]/10 hover:bg-red-500/10 border border-[#22c55e]/30 hover:border-red-500/30 text-[#4ade80] hover:text-red-400 text-[10px] font-bold text-center transition-all group flex items-center justify-center gap-1"
          >
            <span className="group-hover:hidden">✓ Done</span>
            <span className="hidden group-hover:inline flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              Undo
            </span>
          </button>
        ) : (
          <>
            <button
              onClick={() => onPreparing(order.id)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-[0.97] ${
                order.ticketState === 'PREPARING'
                  ? 'bg-blue-500 text-white'
                  : 'bg-black/20 border border-white/10 text-[#a1a1aa] hover:bg-black/40'
              }`}
            >
              {order.ticketState === 'PREPARING' ? (
                <span className="flex items-center justify-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : 'Start'}
            </button>
            <button
              onClick={() => onDone(order.id)}
              className="flex-1 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a1a0f] text-[10px] font-bold transition-all active:scale-[0.97]"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function KdsBoard({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await api.get('/kot');
        const data = res.data;
        const mapped: KitchenOrder[] = (data.tickets ?? []).map((ticket: any) => {
          const dbOrder = ticket.order ?? {};
          const elapsed = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 60000);
          
          const mappedItems: KitchenItem[] = (ticket.items ?? []).map((ki: any) => {
            const oi = ki.orderItem ?? {};
            return {
              name: oi.product?.name ?? 'Unknown Product',
              quantity: oi.quantity ?? 1,
              notes: oi.notes ?? undefined,
            };
          });

          return {
            id: ticket.id,
            orderNumber: dbOrder.orderNumber ?? 0,
            type: dbOrder.orderType === 'takeaway' ? 'TAKEAWAY' : 'DINE_IN',
            tableName: dbOrder.table?.tableNumber ?? dbOrder.customerName ?? 'Table',
            items: mappedItems,
            minutesElapsed: elapsed,
            ticketState: (ticket.status === 'ready' ? 'DONE' : (ticket.status?.toUpperCase() ?? 'PENDING')) as TicketState,
          };
        });

        setOrders(mapped);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch KOT tickets:", err);
        setError("Failed to load kitchen tickets.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Failed to transition display layout frames:", err);
    }
  };

  const handlePreparing = async (id: string) => {
    try {
      const ticket = orders.find(o => o.id === id);
      if (!ticket) return;
      const nextStatus = ticket.ticketState === 'PREPARING' ? 'pending' : 'preparing';
      await api.patch(`/kot/${id}`, { status: nextStatus });
      setOrders(prev =>
        prev.map(o =>
          o.id === id
            ? { ...o, ticketState: nextStatus.toUpperCase() as TicketState }
            : o
        )
      );
    } catch (err) {
      console.error("Failed to update status to preparing:", err);
    }
  };

  const handleDone = async (id: string) => {
    try {
      const ticket = orders.find(o => o.id === id);
      if (!ticket) return;
      const nextStatus = ticket.ticketState === 'DONE' ? 'preparing' : 'ready';
      await api.patch(`/kot/${id}`, { status: nextStatus });
      setOrders(prev =>
        prev.map(o =>
          o.id === id
            ? { ...o, ticketState: (nextStatus === 'ready' ? 'DONE' : 'PREPARING') as TicketState }
            : o
        )
      );
    } catch (err) {
      console.error("Failed to update status to done:", err);
    }
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      <div className="fixed inset-0 h-screen w-screen bg-[#111113] text-[#e4e4e7] font-sans select-none antialiased flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-[#18181b] border-b border-[#27272a] px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <p className="text-[16px] font-bold text-white">Kitchen Display System</p>
            <span className="text-[12px] text-[#52525b] tabular-nums"><LiveClock /></span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] text-[#a1a1aa] hover:text-white px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/>
                  </svg>
                  Exit Full
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
                  </svg>
                  Fullscreen
                </>
              )}
            </button>

            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 bg-[#27272a] hover:bg-red-950/40 border border-[#3f3f46] hover:border-red-900/50 text-[#a1a1aa] hover:text-red-400 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* Kanban columns */}
        <main className="flex-1 flex gap-5 p-6 overflow-hidden w-full">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-neutral-600 gap-3">
              <svg className="w-6 h-6 animate-spin text-[#e5b83b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" className="opacity-25" />
                <path d="M4 12a8 8 0 0 1 8-8" className="opacity-75" />
              </svg>
              <span className="text-sm font-medium">Loading kitchen board...</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-500 gap-3">
              <span className="text-sm font-medium">{error}</span>
            </div>
          ) : (
            COLUMNS.map(col => {
              const colOrders = orders.filter(o => o.ticketState === col.state);
              return (
                <div key={col.state} className="flex flex-col flex-1 min-w-[280px] h-full overflow-hidden">

                  {/* Column header */}
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-4 flex-shrink-0 ${col.headerBg}`}>
                    <span className="text-[13px] font-bold text-white">{col.label}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.countBg}`}>
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Scrollable grid area to safeguard against weird rotation bounding boxes */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden pb-6 pr-1 custom-scrollbar">
                    {colOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-[#3f3f46]">
                        <svg className="w-8 h-8 mb-2 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                        </svg>
                        <p className="text-[12px] font-medium opacity-70">Nothing here</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5 pt-1 px-1">
                        {colOrders.map(order => (
                          <TicketCard
                            key={order.id}
                            order={order}
                            onPreparing={handlePreparing}
                            onDone={handleDone}
                            onOpen={() => setSelectedOrder(order)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <OrderModal
          order={orders.find(o => o.id === selectedOrder.id)!}
          onClose={() => setSelectedOrder(null)}
          onPreparing={handlePreparing}
          onDone={handleDone}
        />
      )}
    </>
  );
}