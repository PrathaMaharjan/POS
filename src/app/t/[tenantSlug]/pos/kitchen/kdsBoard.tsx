"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useKotTickets } from '@/lib/hooks/useKotTickets';
import SettingsDrawer from '../_components/SettingsDrawer';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { Loader2 } from 'lucide-react';

type TicketState = 'PENDING' | 'PREPARING' | 'DONE';
type OrderType = 'TAKEAWAY' | 'DINE_IN';

interface KitchenItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface KitchenOrder {
  id: string;
  ticketId: string;
  kotItemId?: string;
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isUrgent = order.minutesElapsed >= 10;
  const label = order.type === 'TAKEAWAY' ? 'Take away' : order.tableName;

  const modalHeaderBg = order.ticketState === 'DONE'
    ? (isDark ? 'bg-[#22c55e]/15' : 'bg-green-50')
    : order.ticketState === 'PREPARING'
      ? (isDark ? 'bg-blue-500/15' : 'bg-blue-50')
      : isUrgent
        ? (isDark ? 'bg-red-500/15' : 'bg-red-50')
        : (isDark ? 'bg-[#27272a]/60' : 'bg-neutral-50');

  const modalHeaderBorder = isDark ? 'border-[#27272a]' : 'border-neutral-200';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl border w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col transition-colors duration-200 ${isDark ? 'bg-[#1c1c1f] border-[#3f3f46]' : 'bg-white border-neutral-200'
          }`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`px-5 pt-4 pb-3.5 border-b shrink-0 ${modalHeaderBg} ${modalHeaderBorder}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-[16px] font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>#{order.orderNumber}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${order.type === 'TAKEAWAY'
                ? 'bg-[#e5b83b]/10 text-[#e5b83b] border-[#e5b83b]/25'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                }`}>
                {label}
              </span>
              <span className={`text-[11px] font-bold ${isUrgent ? 'text-red-400' : isDark ? 'text-[#52525b]' : 'text-neutral-400'}`}>
                {isUrgent ? `⚠ ${order.minutesElapsed}m` : `${order.minutesElapsed}m`}
              </span>
            </div>
            <button
              onClick={onClose}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-[#27272a] text-[#71717a] hover:text-white' : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700'
                }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-2 flex flex-col overflow-y-auto custom-scrollbar flex-1">
          {order.items.map((item, idx, arr) => (
            <React.Fragment key={idx}>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold break-words ${isDark ? 'text-[#d4d4d8]' : 'text-neutral-800'}`}>{item.name}</p>
                  {item.notes && (
                    <p className="text-[11px] text-red-500 italic mt-0.5">{item.notes}</p>
                  )}
                </div>
                <span className={`text-[12px] font-bold border rounded px-2 py-0.5 flex-shrink-0 self-start ${isDark ? 'text-[#a1a1aa] bg-[#27272a] border-[#3f3f46]' : 'text-neutral-600 bg-neutral-100 border-neutral-200'
                  }`}>
                  x{item.quantity}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div className={`border-t border-dashed ${isDark ? 'border-[#2e2e32]' : 'border-neutral-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className={`px-5 pb-5 pt-3 flex gap-2 shrink-0 border-t ${isDark ? 'border-[#27272a]' : 'border-neutral-200'}`}>
          {order.ticketState === 'DONE' ? (
            <button
              onClick={() => { onDone(order.id); onClose(); }}
              className={`flex-1 py-3 rounded-xl border text-[12px] font-bold text-center transition-all group flex items-center justify-center gap-1 ${isDark
                ? 'bg-[#22c55e]/10 hover:bg-red-500/10 border-[#22c55e]/30 hover:border-red-500/30 text-[#4ade80] hover:text-red-400'
                : 'bg-green-50 hover:bg-red-50 border-green-200 hover:border-red-200 text-green-700 hover:text-red-600'
                }`}
            >
              <span className="group-hover:hidden">✓ Done</span>
              <span className="hidden group-hover:inline flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                Undo Move
              </span>
            </button>
          ) : (
            <>
              <button
                onClick={() => { onPreparing(order.id); onClose(); }}
                className={`flex-1 py-3 rounded-xl text-[12px] font-bold transition-all active:scale-[0.97] ${order.ticketState === 'PREPARING'
                  ? 'bg-blue-600 text-white'
                  : isDark
                    ? 'bg-[#27272a] border border-[#3f3f46] text-[#a1a1aa] hover:bg-[#3f3f46]'
                    : 'bg-neutral-100 border border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                  }`}
              >
                {order.ticketState === 'PREPARING' ? '● Preparing' : 'Start Preparing'}
              </button>
              <button
                onClick={() => { onDone(order.id); onClose(); }}
                className="flex-1 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] dark:text-[#0a1a0f] text-white text-[12px] font-bold transition-all active:scale-[0.97]"
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isUrgent = order.minutesElapsed >= 10;
  const label = order.type === 'TAKEAWAY' ? 'Take away' : order.tableName;
  const rotation = getRotationClass(order.id);

  const stickyBg =
    order.ticketState === 'DONE'
      ? (isDark ? 'bg-[#1a2e1f] border-emerald-950/40 text-emerald-100' : 'bg-[#e8f5e9] border-emerald-200 text-emerald-900')
      : order.ticketState === 'PREPARING'
        ? (isDark ? 'bg-[#17213a] border-blue-950/40 text-blue-100' : 'bg-[#e3f2fd] border-blue-200 text-blue-900')
        : isUrgent
          ? (isDark ? 'bg-[#2a1a1a] border-red-950/40 text-red-100' : 'bg-[#ffebee] border-red-200 text-red-900')
          : (isDark ? 'bg-[#21201a] border-amber-950/40 text-amber-100' : 'bg-[#fffde7] border-amber-200 text-amber-900');

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
      className={`${stickyBg} ${rotation} border rounded-xl shadow-lg hover:shadow-xl dark:shadow-[2px_4px_16px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-all duration-200 hover:scale-[1.02] sm:hover:rotate-0 cursor-pointer h-full`}
      onClick={onOpen}
    >
      <div className={`h-2 w-full ${tapeBg}`} />

      {order.ticketState === 'PREPARING' && (
        <div className="h-0.5 w-full bg-[#1e2a3a] overflow-hidden relative">
          <div
            className="h-full bg-blue-400/70 absolute top-0 left-0"
            style={{ width: '45%', animation: 'shimmer 1.8s ease-in-out infinite' }}
          />
        </div>
      )}

      <div className="px-3.5 pt-3 pb-2.5 border-b border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`text-[13px] font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>#{order.orderNumber}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${order.type === 'TAKEAWAY'
              ? 'bg-[#e5b83b]/10 text-[#e5b83b] border-[#e5b83b]/25'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
              }`}>
              {label}
            </span>
          </div>
          <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-400' : isDark ? 'text-[#52525b]' : 'text-neutral-400'}`}>
            {isUrgent ? `⚠ ${order.minutesElapsed}m` : `${order.minutesElapsed}m`}
          </span>
        </div>
      </div>

      <div className="px-3.5 py-2 flex flex-col flex-1 overflow-hidden">
        {order.items.slice(0, 3).map((item, idx, arr) => (
          <React.Fragment key={idx}>
            <div className="flex items-center justify-between gap-2 py-1.5">
              <span className={`text-[11px] font-semibold flex-1 leading-tight break-all truncate ${isDark ? 'text-[#c4c4c8]' : 'text-neutral-800'}`}>{item.name}</span>
              {item.notes && (
                <span className="text-[9px] text-red-500 italic truncate max-w-[70px]">{item.notes}</span>
              )}
              <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ml-1 flex-shrink-0 ${isDark ? 'text-[#71717a] bg-black/20 border-white/10' : 'text-neutral-600 bg-black/5 border-black/10'}`}>
                x{item.quantity}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <div className={`border-t border-dashed mx-1 ${isDark ? 'border-white/8' : 'border-black/8'}`} />
            )}
          </React.Fragment>
        ))}
        {order.items.length > 3 && (
          <p className={`text-[10px] mt-auto pt-2 ${isDark ? 'text-[#52525b]' : 'text-neutral-500'}`}>+{order.items.length - 3} more — tap to view</p>
        )}
      </div>

      <div
        className="px-3 pb-3 pt-1 mt-auto flex gap-2"
        onClick={e => e.stopPropagation()}
      >
        {order.ticketState === 'DONE' ? (
          <button
            onClick={() => onDone(order.id)}
            className={`flex-1 py-2 rounded-lg border text-[10px] font-bold text-center transition-all group flex items-center justify-center gap-1 ${isDark
              ? 'bg-[#22c55e]/10 hover:bg-red-500/10 border-[#22c55e]/30 hover:border-red-500/30 text-[#4ade80] hover:text-red-400'
              : 'bg-green-50 hover:bg-red-50 border-green-200 hover:border-red-200 text-green-700 hover:text-red-600'
              }`}
          >
            <span className="group-hover:hidden">✓ Done</span>
            <span className="hidden group-hover:inline flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              Undo
            </span>
          </button>
        ) : (
          <>
            <button
              onClick={() => onPreparing(order.id)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-[0.97] ${order.ticketState === 'PREPARING'
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'bg-black/20 border border-white/10 text-[#a1a1aa] hover:bg-black/40'
                  : 'bg-white/60 border border-black/10 text-neutral-700 hover:bg-white/90 shadow-sm'
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
              className="flex-1 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] dark:text-[#0a1a0f] text-white text-[10px] font-bold transition-all active:scale-[0.97]"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function KdsBoardInner({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);


  const [activeTab, setActiveTab] = useState<TicketState>('PENDING');

  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [showWastageSuccess, setShowWastageSuccess] = useState(false);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isSubmittingWastage, setIsSubmittingWastage] = useState(false);
  const [wastageError, setWastageError] = useState<string | null>(null);
  const [wastageForm, setWastageForm] = useState({
    stockItemId: "",
    quantity: "",
    note: "",
  });

  useEffect(() => {
    if (!isWastageModalOpen) return;

    const fetchStock = async () => {
      setIsLoadingStock(true);
      setWastageError(null);
      try {
        const res = await api.get("/inventory");
        if (res.data && res.data.stockItems) {
          setStockItems(res.data.stockItems);
        }
      } catch (err: any) {
        console.error("Failed to load stock items:", err);
        setWastageError("Failed to load inventory items.");
      } finally {
        setIsLoadingStock(false);
      }
    };

    fetchStock();
  }, [isWastageModalOpen]);

  const selectedStockItem = stockItems.find(item => item.id === wastageForm.stockItemId);

  const { tickets: rawTickets, refetch } = useKotTickets(10000);

  useEffect(() => {
    try {
      const virtualOrders: KitchenOrder[] = [];
      (rawTickets ?? [])
        .filter((ticket: any) => {
          const status = ticket.status?.toLowerCase();
          return status !== 'served' && status !== 'cancelled';
        })
        .forEach((ticket: any) => {
          const dbOrder = ticket.order ?? {};
          const elapsed = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 60000);

          (ticket.items ?? []).forEach((ki: any) => {
            const oi = ki.orderItem ?? {};
            const baseItemName = oi.product?.name ?? ki.product?.name ?? oi.name ?? ki.name ?? 'Unknown Product';
            const itemName = oi.variantLabel ? `${baseItemName} (${oi.variantLabel})` : baseItemName;
            const quantity = oi.quantity ?? 1;
            const notes = oi.notes ?? undefined;

            const localState = localStorage.getItem(`kds_item_state_${ticket.id}_${itemName}`);

            let mappedState: TicketState = 'PENDING';
            if (localState) {
              mappedState = localState as TicketState;
            } else {
              const normalizedStatus = ticket.status?.toLowerCase();
              if (normalizedStatus === 'ready') {
                mappedState = 'DONE';
              } else if (normalizedStatus === 'processing' || normalizedStatus === 'preparing') {
                mappedState = 'PREPARING';
              }
            }

            virtualOrders.push({
              id: `${ticket.id}_${itemName}`, // unique virtual ID
              ticketId: ticket.id, // reference to actual KOT ID
              kotItemId: ki.id, // KOT item ID in database
              orderNumber: dbOrder.orderNumber ?? 0,
              type: dbOrder.orderType === 'takeaway' ? 'TAKEAWAY' : 'DINE_IN',
              tableName: dbOrder.table?.tableNumber ?? dbOrder.customerName ?? 'Table',
              items: [{
                name: itemName,
                quantity: quantity,
                notes: notes,
              }],
              minutesElapsed: elapsed,
              ticketState: mappedState,
            });
          });
        });

      setOrders(virtualOrders);
      setError(null);
    } catch (err) {
      console.error("Failed to map KOT tickets:", err);
      setError("Failed to load kitchen tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [rawTickets]);

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
      const virtualOrder = orders.find(o => o.id === id);
      if (!virtualOrder) return;

      const ticketId = virtualOrder.ticketId;
      const kotItemId = virtualOrder.kotItemId;
      const itemName = virtualOrder.items[0]?.name;
      if (!itemName) return;

      const nextState: TicketState = virtualOrder.ticketState === 'PREPARING' ? 'PENDING' : 'PREPARING';
      localStorage.setItem(`kds_item_state_${ticketId}_${itemName}`, nextState);

      const dbTicket = rawTickets?.find((t: any) => t.id === ticketId);
      const dbItem = dbTicket?.items?.find((item: any) => item.id === kotItemId);
      const dbItemStatus = dbItem?.status?.toLowerCase();

      // Update the individual KOT item status in the backend if transitioning forward to preparing
      if (kotItemId) {
        if (nextState === 'PREPARING' && dbItemStatus !== 'preparing') {
          try {
            await api.patch(`/kot/singlekot/${kotItemId}`, { status: 'preparing' });
          } catch (itemErr) {
            console.error("Failed to patch individual KOT item to preparing:", itemErr);
          }
        }
      } else {
        // Try to update the main ticket on the backend to match (fallback only if no items)
        const nextStatus = nextState === 'PREPARING' ? 'preparing' : 'pending';
        const dbTicketStatus = dbTicket?.status?.toLowerCase();
        if (dbTicketStatus !== nextStatus) {
          try {
            await api.patch(`/kot/${ticketId}`, { status: nextStatus });
          } catch (ticketErr) {
            console.error("Failed to patch KOT ticket status:", ticketErr);
          }
        }
      }

      setOrders(prev =>
        prev.map(o =>
          o.id === id
            ? { ...o, ticketState: nextState }
            : o
        )
      );
      refetch();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDone = async (id: string) => {
    try {
      const virtualOrder = orders.find(o => o.id === id);
      if (!virtualOrder) return;

      const ticketId = virtualOrder.ticketId;
      const kotItemId = virtualOrder.kotItemId;
      const itemName = virtualOrder.items[0]?.name;
      if (!itemName) return;

      const nextState: TicketState = virtualOrder.ticketState === 'DONE' ? 'PREPARING' : 'DONE';
      localStorage.setItem(`kds_item_state_${ticketId}_${itemName}`, nextState);

      const dbTicket = rawTickets?.find((t: any) => t.id === ticketId);
      const dbItem = dbTicket?.items?.find((item: any) => item.id === kotItemId);
      const dbItemStatus = dbItem?.status?.toLowerCase();
      const nextItemStatus = nextState === 'DONE' ? 'ready' : 'preparing';

      // Update the individual KOT item status in the backend
      if (kotItemId) {
        if (dbItemStatus !== nextItemStatus) {
          try {
            const isPending = !dbItemStatus || dbItemStatus === 'pending';
            if (isPending && nextItemStatus === 'ready') {
              // Sequentially transition: pending -> preparing -> ready to bypass backend constraints
              await api.patch(`/kot/singlekot/${kotItemId}`, { status: 'preparing' });
              await api.patch(`/kot/singlekot/${kotItemId}`, { status: 'ready' });
            } else {
              await api.patch(`/kot/singlekot/${kotItemId}`, { status: nextItemStatus });
            }
          } catch (itemErr) {
            console.error("Failed to patch individual KOT item status:", itemErr);
          }
        }
      } else {
        // Check if all virtual orders of this ticket are DONE
        const siblingOrders = orders.filter(o => o.ticketId === ticketId && o.id !== id);
        const allSiblingsDone = siblingOrders.every(o => o.ticketState === 'DONE');
        const allDone = nextState === 'DONE' && allSiblingsDone;

        const nextStatus = allDone ? 'ready' : 'preparing';
        const dbTicketStatus = dbTicket?.status?.toLowerCase();
        if (dbTicketStatus !== nextStatus) {
          try {
            await api.patch(`/kot/${ticketId}`, { status: nextStatus });
          } catch (ticketErr) {
            console.error("Failed to patch KOT ticket status:", ticketErr);
          }
        }
      }

      setOrders(prev =>
        prev.map(o =>
          o.id === id
            ? { ...o, ticketState: nextState }
            : o
        )
      );
      refetch();
    } catch (err) {
      console.error("Failed to update status to done:", err);
    }
  };

  const columnsConfig = [
    {
      state: 'PENDING' as TicketState,
      label: 'New Orders',
      headerBg: isDark ? 'bg-[#e5b83b]/8 border-[#e5b83b]/15 text-white' : 'bg-[#e5b83b]/12 border-[#e5b83b]/25 text-amber-950',
      countBg: isDark ? 'bg-[#e5b83b]/15 text-[#e5b83b] border-[#e5b83b]/25' : 'bg-[#e5b83b]/20 text-amber-800 border-[#e5b83b]/30',
    },
    {
      state: 'PREPARING' as TicketState,
      label: 'Preparing',
      headerBg: isDark ? 'bg-blue-500/8 border-blue-500/15 text-white' : 'bg-blue-500/12 border-blue-500/25 text-blue-950',
      countBg: isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' : 'bg-blue-500/20 text-blue-800 border-blue-500/30',
    },
    {
      state: 'DONE' as TicketState,
      label: 'Ready to Serve',
      headerBg: isDark ? 'bg-[#22c55e]/8 border-[#22c55e]/15 text-white' : 'bg-green-500/12 border-green-500/25 text-green-950',
      countBg: isDark ? 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/25' : 'bg-green-500/20 text-green-800 border-green-500/30',
    },
  ];

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
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? '#27272a' : '#d4d4d8'};
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#3f3f46' : '#a1a1aa'};
        }
      `}</style>

      <div className={`fixed inset-0 h-screen w-screen font-sans select-none antialiased flex flex-col overflow-hidden transition-colors duration-200 ${isDark ? 'bg-[#111113] text-[#e4e4e7]' : 'bg-[#f4f4f5] text-neutral-800'
        }`}>

        {/* Header */}
        <header className={`border-b px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-4 transition-colors duration-200 ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-neutral-200'
          }`}>
          <div className="flex items-center gap-3 min-w-0">
            <p className={`text-[14px] sm:text-[16px] font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>Kitchen Display</p>
            <span className={`text-[11px] sm:text-[12px] tabular-nums shrink-0 ${isDark ? 'text-[#52525b]' : 'text-neutral-400'}`}><LiveClock /></span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsWastageModalOpen(true)}
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-semibold transition-all ${isDark
                ? 'bg-[#27272a] hover:bg-[#3f3f46] border-[#3f3f46] text-[#a1a1aa] hover:text-white'
                : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900 shadow-sm'
                }`}
              title="Report Wastage"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
              </svg>
              <span className="hidden sm:inline">Report Wastage</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-semibold transition-all ${isDark
                ? 'bg-[#27272a] hover:bg-[#3f3f46] border-[#3f3f46] text-[#a1a1aa] hover:text-white'
                : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900 shadow-sm'
                }`}
              title="Open Settings"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-semibold transition-all ${isDark
                ? 'bg-[#27272a] hover:bg-[#3f3f46] border-[#3f3f46] text-[#a1a1aa] hover:text-white'
                : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900 shadow-sm'
                }`}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
                  </svg>
                  <span className="hidden sm:inline">Exit Full</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </button>

            <button
              onClick={async () => {
                try {
                  await api.post("/auth/logout");
                } catch (err) {
                  console.error("Failed to cleanly terminate kitchen session:", err);
                } finally {
                  router.push("/login");
                }
              }}
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-semibold transition-all ${isDark
                ? 'bg-[#27272a] hover:bg-red-950/40 border-[#3f3f46] hover:border-red-900/50 text-[#a1a1aa] hover:text-red-400'
                : 'bg-white hover:bg-red-50 border-neutral-200 hover:border-red-200 text-neutral-600 hover:text-red-600 shadow-sm'
                }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Tabs (visible only on viewports below 'md') */}
        <div className={`flex md:hidden border-b p-2 gap-1 shrink-0 ${isDark ? 'bg-[#141416] border-[#27272a]' : 'bg-neutral-100 border-neutral-200'}`}>
          {columnsConfig.map(col => {
            const count = orders.filter(o => o.ticketState === col.state).length;
            const isActive = activeTab === col.state;
            return (
              <button
                key={col.state}
                onClick={() => setActiveTab(col.state)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-1 rounded-xl text-[12px] font-bold border transition-all ${isActive
                  ? isDark
                    ? 'bg-[#27272a] text-white border-[#3f3f46]'
                    : 'bg-white text-neutral-900 border-neutral-300 shadow-sm'
                  : 'bg-transparent text-[#71717a] border-transparent'
                  }`}
              >
                <span>{col.label.split(' ')[0]}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-md border ${isDark
                  ? 'bg-white/5 border-white/10 text-[#a1a1aa]'
                  : 'bg-neutral-200/50 border-neutral-300 text-neutral-600'
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Kanban columns */}
        <main className="flex-1 flex flex-col md:flex-row gap-4 lg:gap-5 p-4 sm:p-6 overflow-hidden w-full">
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
            columnsConfig.map(col => {
              const colOrders = orders.filter(o => o.ticketState === col.state);

              return (
                <div
                  key={col.state}
                  className={`flex-col flex-1 md:min-w-[240px] lg:min-w-[280px] h-full overflow-hidden ${activeTab === col.state ? 'flex' : 'hidden md:flex'
                    }`}
                >
                  {/* Column header */}
                  <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border mb-3 sm:mb-4 flex-shrink-0 ${col.headerBg}`}>
                    <span className="text-[12px] sm:text-[13px] font-bold">{col.label}</span>
                    <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.countBg}`}>
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Scrollable grid area */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4 pr-1 custom-scrollbar">
                    {colOrders.length === 0 ? (
                      <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'text-[#3f3f46]' : 'text-neutral-400'}`}>
                        <svg className="w-8 h-8 mb-2 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                        </svg>
                        <p className="text-[11px] font-medium opacity-70">Nothing here</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 sm:gap-5 pt-1 px-1">
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

      {/* Settings Drawer */}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Wastage Modal */}
      {isWastageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => !isSubmittingWastage && setIsWastageModalOpen(false)}
        >
          <div
            className={`rounded-2xl border w-full max-w-md overflow-hidden shadow-2xl flex flex-col transition-colors duration-200 ${isDark ? 'bg-[#1c1c1f] border-[#3f3f46]' : 'bg-white border-neutral-200'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`px-5 pt-4 pb-3.5 border-b shrink-0 flex items-center justify-between ${isDark ? 'bg-[#27272a]/60 border-[#27272a]' : 'bg-neutral-50 border-neutral-200'}`}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                </svg>
                <h3 className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Report Inventory Wastage</h3>
              </div>
              <button
                disabled={isSubmittingWastage}
                onClick={() => setIsWastageModalOpen(false)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-[#27272a] text-[#71717a] hover:text-white' : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700'} disabled:opacity-55`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!wastageForm.stockItemId || !wastageForm.quantity) {
                  setWastageError("Please select an item and enter a quantity");
                  return;
                }
                const qtyVal = Number(wastageForm.quantity);
                if (isNaN(qtyVal) || qtyVal <= 0) {
                  setWastageError("Quantity must be greater than zero");
                  return;
                }
                if (selectedStockItem && qtyVal > Number(selectedStockItem.currentStock)) {
                  setWastageError(`Wastage quantity cannot exceed current stock level (${selectedStockItem.currentStock} ${selectedStockItem.unit})`);
                  return;
                }
                setIsSubmittingWastage(true);
                setWastageError(null);
                try {
                  const res = await api.post(`/inventory/${wastageForm.stockItemId}/wastage`, {
                    quantity: qtyVal,
                    note: wastageForm.note || "Kitchen wastage",
                  });
                  if (res.data) {
                    setShowWastageSuccess(true);
                    setTimeout(() => setShowWastageSuccess(false), 3000);
                    setIsWastageModalOpen(false);
                    setWastageForm({
                      stockItemId: "",
                      quantity: "",
                      note: "",
                    });
                  }
                } catch (err: any) {
                  console.error("Wastage report failure:", err);
                  const errMsg = err.response?.data?.error ?? err.message ?? "Failed to submit wastage";
                  setWastageError(typeof errMsg === "string" ? errMsg : "Failed to report wastage. Double check permissions.");
                } finally {
                  setIsSubmittingWastage(false);
                }
              }}
              className="p-5 flex flex-col gap-4"
            >
              {wastageError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/25 p-3 text-xs text-red-500 font-medium">
                  {wastageError}
                </div>
              )}

              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#a1a1aa]' : 'text-neutral-500'}`}>
                  Select Inventory Item *
                </label>
                {isLoadingStock ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-400 py-2.5">
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-neutral-500" />
                    <span>Loading active stock items...</span>
                  </div>
                ) : (
                  <select
                    required
                    disabled={isSubmittingWastage}
                    value={wastageForm.stockItemId}
                    onChange={(e) => setWastageForm({ ...wastageForm, stockItemId: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none transition-all ${isDark
                      ? 'bg-[#18181b] border-[#3f3f46] text-white focus:border-[#e5b83b]/60'
                      : 'bg-white border-neutral-200 text-neutral-800 focus:border-neutral-400 shadow-sm'
                      }`}
                  >
                    <option value="">-- Choose an item --</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#a1a1aa]' : 'text-neutral-500'}`}>
                    Quantity {selectedStockItem ? `(${selectedStockItem.unit})` : ""} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.001"
                    step="0.001"
                    disabled={isSubmittingWastage || !wastageForm.stockItemId}
                    value={wastageForm.quantity}
                    onChange={(e) => setWastageForm({ ...wastageForm, quantity: e.target.value })}
                    placeholder={selectedStockItem ? `Max current stock is ${selectedStockItem.currentStock}` : "Select item first"}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs focus:outline-none transition-all ${isDark
                      ? 'bg-[#18181b] border-[#3f3f46] text-white focus:border-[#e5b83b]/60'
                      : 'bg-white border-neutral-200 text-neutral-800 focus:border-neutral-400 shadow-sm'
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#a1a1aa]' : 'text-neutral-500'}`}>
                  Wastage Note
                </label>
                <textarea
                  disabled={isSubmittingWastage}
                  value={wastageForm.note}
                  onChange={(e) => setWastageForm({ ...wastageForm, note: e.target.value })}
                  placeholder="e.g. Expired, spilled during preparation, overcooked..."
                  rows={3}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs focus:outline-none transition-all resize-none ${isDark
                    ? 'bg-[#18181b] border-[#3f3f46] text-white focus:border-[#e5b83b]/60'
                    : 'bg-white border-neutral-200 text-neutral-800 focus:border-neutral-400 shadow-sm'
                    }`}
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  disabled={isSubmittingWastage}
                  onClick={() => setIsWastageModalOpen(false)}
                  className={`flex-1 py-3 rounded-xl border text-[12px] font-bold text-center transition-all ${isDark
                    ? 'bg-transparent border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWastage || !wastageForm.stockItemId}
                  className="flex-1 py-3 rounded-xl text-[12px] font-bold text-center transition-all text-white bg-red-600 hover:bg-red-700 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingWastage && <Loader2 className="h-3 w-3 animate-spin text-white" />}
                  Submit Wastage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {showWastageSuccess && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg animate-bounce">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-bold">Wastage reported successfully!</span>
        </div>
      )}

      {/* Settings Drawer */}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

export default function KdsBoard({ tenantSlug }: { tenantSlug: string }) {
  return (
    <ThemeProvider role="kitchen">
      <KdsBoardInner tenantSlug={tenantSlug} />
    </ThemeProvider>
  );
}