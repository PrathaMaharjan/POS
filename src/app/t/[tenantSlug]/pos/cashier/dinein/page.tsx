"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TableModal from '../../_components/TableModal';
import api from '@/lib/api';

import {
  Armchair,
  Users,
  Bookmark,
  Eraser,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  LayoutGrid,
} from 'lucide-react';

type TableStatus = 'available' | 'occupied' | 'reserved' | 'dirty';
type TableShape = 'square' | 'round';

interface ActiveFoodItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

interface ActiveFoodStatus {
  id: string;
  orderNumber: number;
  tableName: string;
  type: 'DINE_IN' | 'TAKEAWAY';
  ticketState: 'PENDING' | 'PREPARING' | 'DONE';
  items: ActiveFoodItem[];
}

interface Table {
  id: string;
  label: string;
  status: TableStatus;
  shape: TableShape;
  seats: number;
}

interface TablesProps {
  tenantSlug: string;
  role?: 'cashier' | 'waiter';
}

// ── Card size constants (px) ──────────────────────────────────────────────────
const CARD_W = 140;
const CARD_H = 140;
const GRID_COLS = 6;
const GRID_GAP = 24;
const CANVAS_PADDING = 24;

// Build a default grid layout for a list of tables
function defaultLayout(tables: Table[]): Record<string, { x: number; y: number }> {
  const layout: Record<string, { x: number; y: number }> = {};
  tables.forEach((t, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    layout[t.id] = {
      x: CANVAS_PADDING + col * (CARD_W + GRID_GAP),
      y: CANVAS_PADDING + row * (CARD_H + GRID_GAP),
    };
  });
  return layout;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TableStatus, {
  borderColor: string;
  shadowColor: string;
  iconColor: string;
  label: string;
  dotColor: string;
}> = {
  available: {
    borderColor: 'border-[#22c55e]/20 hover:border-[#22c55e]/50',
    shadowColor: 'hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]',
    iconColor: 'text-[#22c55e]',
    label: 'Available',
    dotColor: 'bg-[#22c55e]',
  },
  occupied: {
    borderColor: 'border-[#ef4444]/40 hover:border-[#ef4444]/70',
    shadowColor: 'hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    iconColor: 'text-[#ef4444]',
    label: 'Occupied',
    dotColor: 'bg-[#ef4444]',
  },
  reserved: {
    borderColor: 'border-[#3b82f6]/30 hover:border-[#3b82f6]/60',
    shadowColor: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    iconColor: 'text-[#3b82f6]',
    label: 'Reserved',
    dotColor: 'bg-[#3b82f6]',
  },
  dirty: {
    borderColor: 'border-[#e5b83b]/30 hover:border-[#e5b83b]/60',
    shadowColor: 'hover:shadow-[0_0_15px_rgba(229,184,59,0.15)]',
    iconColor: 'text-[#e5b83b]',
    label: 'Dirty',
    dotColor: 'bg-[#e5b83b]',
  },
};

// ── Draggable TableCard ───────────────────────────────────────────────────────
function TableCard({
  table,
  position,
  isReadyToServe,
  isDragging,
  onPointerDown,
  onClick,
}: {
  table: Table;
  position: { x: number; y: number };
  isReadyToServe: boolean;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[table.status];
  const isRound = table.shape === 'round';

  const renderStatusIcon = () => {
    if (isReadyToServe) return <CheckCircle2 className="w-7 h-7 text-[#22c55e]" strokeWidth={1.75} />;
    switch (table.status) {
      case 'occupied': return <Users className={`w-7 h-7 ${cfg.iconColor}`} strokeWidth={1.75} />;
      case 'reserved': return <Bookmark className={`w-7 h-7 ${cfg.iconColor}`} strokeWidth={1.75} />;
      case 'dirty': return <Eraser className={`w-7 h-7 ${cfg.iconColor}`} strokeWidth={1.75} />;
      default: return <Armchair className={`w-7 h-7 ${cfg.iconColor}`} strokeWidth={1.75} />;
    }
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: CARD_W,
        height: CARD_H,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 50 : 1,
        userSelect: 'none',
        touchAction: 'none',
      }}
      className={`
        group flex flex-col items-center justify-center text-center
        bg-[#141416] border transition-all duration-200 p-3 gap-2 select-none
        ${isRound ? 'rounded-full' : 'rounded-2xl'}
        ${isDragging
          ? 'shadow-[0_8px_32px_rgba(0,0,0,0.5)] scale-105 opacity-90'
          : isReadyToServe
            ? 'border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.35)] animate-[pulse_1.8s_infinite] scale-[1.02]'
            : `${cfg.borderColor} ${cfg.shadowColor}`}
      `}
    >
      {isReadyToServe && !isDragging && (
        <span className="absolute -top-2 bg-[#22c55e] text-[#0a1a0f] text-[9px] font-black tracking-wider px-2 py-0.5 rounded-md uppercase shadow-lg">
          READY
        </span>
      )}
      <span className="text-[11px] font-medium text-neutral-400 tracking-wider uppercase group-hover:text-white transition-colors leading-tight">
        {table.label}
      </span>
      {renderStatusIcon()}
      <div className="flex items-center gap-1 px-2 py-0.5 bg-neutral-900/60 border border-neutral-800 rounded-full">
        <span className="text-[10px] font-medium text-neutral-400 tracking-wide">
          {table.seats} Seats
        </span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Tables({ tenantSlug: propTenantSlug, role = 'cashier' }: TablesProps) {
  const router = useRouter();
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = propTenantSlug || params?.tenantSlug;

  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<ActiveFoodStatus[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [confirmingTakeawayId, setConfirmingTakeawayId] = useState<string | null>(null);
  const [expandedTakeawayId, setExpandedTakeawayId] = useState<string | null>(null);

  // ── Drag state ──────────────────────────────────────────────────────────────
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOrigin = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const hasDragged = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const storageKey = `table-layout-${tenantSlug ?? 'default'}`;

  // Load saved positions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setPositions(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [storageKey]);

  // Once tables arrive, fill in any missing positions
  useEffect(() => {
    if (tables.length === 0) return;
    setPositions(prev => {
      const missing = tables.filter(t => !prev[t.id]);
      if (missing.length === 0) return prev;
      const defaults = defaultLayout(tables);
      const merged = { ...prev };
      missing.forEach(t => { merged[t.id] = defaults[t.id]; });
      return merged;
    });
  }, [tables]);

  // Persist positions whenever they change
  useEffect(() => {
    if (Object.keys(positions).length === 0) return;
    try { localStorage.setItem(storageKey, JSON.stringify(positions)); } catch { /* ignore */ }
  }, [positions, storageKey]);

  // Canvas height: enough to fit all cards plus padding
  const canvasHeight = Math.max(
    480,
    Object.values(positions).reduce((max, p) => Math.max(max, p.y + CARD_H + CANVAS_PADDING), 0)
  );

  // ── Pointer drag handlers ───────────────────────────────────────────────────
  const handlePointerDown = useCallback((tableId: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    hasDragged.current = false;
    setDraggingId(tableId);
    dragOrigin.current = {
      px: e.clientX,
      py: e.clientY,
      ox: positions[tableId]?.x ?? 0,
      oy: positions[tableId]?.y ?? 0,
    };
  }, [positions]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId || !dragOrigin.current || !canvasRef.current) return;
    const dx = e.clientX - dragOrigin.current.px;
    const dy = e.clientY - dragOrigin.current.py;

    if (!hasDragged.current && Math.abs(dx) + Math.abs(dy) < 4) return;
    hasDragged.current = true;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(dragOrigin.current.ox + dx, canvasRect.width - CARD_W));
    const newY = Math.max(0, dragOrigin.current.oy + dy);

    setPositions(prev => ({
      ...prev,
      [draggingId]: { x: newX, y: newY },
    }));
  }, [draggingId]);

  const stopDrag = useCallback(() => {
    setDraggingId(null);
    dragOrigin.current = null;
  }, []);

  // Escape key drops the card immediately
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') stopDrag(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stopDrag]);

  const resetLayout = () => {
    const layout = defaultLayout(tables);
    setPositions(layout);
  };

  // ── Data fetching (unchanged) ───────────────────────────────────────────────
  useEffect(() => {
    async function fetchTables(silent = false) {
      try {
        if (!silent) setIsLoading(true);
        const res = await api.get('/tables');
        const raw = res.data.tables ?? [];
        const mapped: Table[] = raw.map((t: any) => ({
          id: t.id,
          label: t.name ?? t.tableNumber ?? `T-${t.id}`,
          status: (t.status as TableStatus) ?? 'available',
          shape: t.shape ?? 'square',
          seats: t.capacity ?? t.seats ?? 2,
        }));
        setTables(mapped);
      } catch (err) {
        console.error('Failed to fetch tables:', err);
      } finally {
        if (!silent) setIsLoading(false);
      }
    }
    fetchTables();
    const interval = setInterval(() => fetchTables(true), 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTickets() {
  try {
    const res = await api.get('/kot');
    const data = res.data;

    const mapped: ActiveFoodStatus[] = (data.tickets ?? [])
      .filter((ticket: any) => ticket.status !== 'served')
      .map((ticket: any) => {
        const dbOrder = ticket.order ?? {};

        const mappedItems: ActiveFoodItem[] = (ticket.items ?? []).map((item: any) => ({
          id: item.id,
          name: item.orderItem?.product?.name ?? 'Deleted Product', // ✅ correct path
          quantity: item.orderItem?.quantity ?? 1,                  // ✅ also from orderItem
          notes: item.orderItem?.notes ?? '',                       // ✅ also from orderItem
        }));

        return {
          id: ticket.id,
          orderNumber: dbOrder.orderNumber ?? 0,
          tableName: dbOrder.table?.tableNumber
            ?? dbOrder.customerName
            ?? 'Takeaway',
          type: dbOrder.orderType === 'takeaway' ? 'TAKEAWAY' : 'DINE_IN',
          ticketState: (
            ticket.status === 'ready' ? 'DONE' : ticket.status?.toUpperCase() ?? 'PENDING'
          ) as ActiveFoodStatus['ticketState'],
          items: mappedItems,
        };
      });

    setActiveOrders(mapped);
  } catch (err) {
    console.error("Failed to fetch KOT tickets:", err);
  }
}

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKotStatusChange = (ticketId: string, nextStatus: string) => {
    setActiveOrders(prev => {
      if (nextStatus === 'served') return prev.filter(order => order.id !== ticketId);
      return prev;
    });
    fetchTickets();
  };

  const occupied = tables.filter(t => t.status === 'occupied').length;
  const total = tables.length;
  const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const checkTableReadyState = (tableLabel: string) => {
    if (role !== 'waiter') return false;
    return activeOrders.some(
      order => order.tableName === tableLabel && order.ticketState === 'DONE' && order.type === 'DINE_IN'
    );
  };

  const handleDismissTakeaway = async (id: string) => {
    try {
      await api.patch(`/kot/${id}`, { status: 'served' });
      setActiveOrders(prev => prev.filter(order => order.id !== id));
      if (expandedTakeawayId === id) setExpandedTakeawayId(null);
    } catch (err) {
      console.error("Failed to dismiss takeaway ticket:", err);
    }
    setConfirmingTakeawayId(null);
  };

  const handleTableStatusChange = async (tableId: string, nextStatus: TableStatus) => {
    setTables(prevTables =>
      prevTables.map(t => t.id === tableId ? { ...t, status: nextStatus } : t)
    );
    setSelectedTable(prev => prev && prev.id === tableId ? { ...prev, status: nextStatus } : prev);
    try {
      await api.patch(`/tables/${tableId}/status`, { status: nextStatus });
    } catch (err: any) {
      console.error('PATCH FAILED:', err.response?.status, err.response?.data);
    }
  };

  const readyTakeaways = activeOrders.filter(o => o.type === 'TAKEAWAY' && o.ticketState === 'DONE');
  const safeSlug = tenantSlug && tenantSlug !== 'undefined' ? tenantSlug : 'default';

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-[#e4e4e7] flex flex-col font-sans select-none antialiased">
      <main className="flex-1 flex flex-col px-8 py-6 gap-6 max-w-[1400px] mx-auto w-full">

        {/* Top Status Indicators & Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-[#141416]/40 border border-neutral-900/60 rounded-2xl px-5 py-3.5">
          <div className="flex items-center flex-wrap gap-3">
            {(Object.keys(STATUS_CONFIG) as TableStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-2 bg-[#0c0c0d]/60 px-3 py-1.5 rounded-lg border border-neutral-900/80">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dotColor}`} />
                <span className="text-xs font-semibold text-neutral-400 tracking-wide">{STATUS_CONFIG[s].label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={resetLayout}
              title="Reset table layout to default grid"
              className="flex items-center gap-2 bg-[#141416] border border-neutral-800 hover:border-neutral-600 text-neutral-500 hover:text-neutral-300 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-150"
            >
              <LayoutGrid className="w-4 h-4" strokeWidth={2} />
              Reset Layout
            </button>
            <button
              onClick={() => {
                if (role === 'cashier') {
                  router.push(`/t/${safeSlug}/pos/cashier`);
                } else {
                  router.push(`/t/${safeSlug}/pos/waiter`);
                }
              }}
              className="flex items-center gap-2 bg-[#141416] border border-neutral-800 hover:border-[#e5b83b]/60 text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-150"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              Go Back
            </button>
          </div>
        </div>

        {/* Cashier Takeaway Pickup Queue Panel */}
        {role === 'cashier' && readyTakeaways.length > 0 && (
          <div className="bg-[#141416] border border-neutral-900 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-black tracking-wider text-neutral-400 uppercase">
              <span>Takeaway Pickup Queue ({readyTakeaways.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyTakeaways.map((order) => {
                const isConfirming = confirmingTakeawayId === order.id;
                const isExpanded = expandedTakeawayId === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setExpandedTakeawayId(isExpanded ? null : order.id)}
                    className={`flex flex-col border rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                      isConfirming
                        ? 'bg-[#291414] border-red-500/30'
                        : isExpanded
                          ? 'bg-[#18181b] border-[#e5b83b]/40 shadow-md shadow-black/40'
                          : 'bg-[#112414] border-[#22c55e]/20 hover:border-[#22c55e]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between px-4 py-3 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-sm font-black ${isConfirming ? 'text-red-400' : 'text-green-400'}`}>
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs text-neutral-300 font-medium truncate">
                          {order.tableName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        {isConfirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDismissTakeaway(order.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md font-black text-[10px] uppercase transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmingTakeawayId(null)}
                              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded-md font-bold text-[10px] uppercase transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingTakeawayId(order.id)}
                            className="bg-[#22c55e] hover:bg-[#16a34a] text-[#0a1a0f] px-2.5 py-1 rounded-md font-black text-[10px] uppercase tracking-wider transition-colors"
                          >
                            Handout
                          </button>
                        )}
                        <div className="text-neutral-400 pl-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-neutral-800/60 bg-black/20 px-4 py-3 flex flex-col gap-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Order Items</div>
                        <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                          {order.items.length === 0 ? (
                            <span className="text-xs text-neutral-500 italic">No item summary available</span>
                          ) : (
                            order.items.map((item, idx) => (
                              <div key={idx} className="flex flex-col gap-0.5 text-xs text-neutral-200">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold">{item.name}</span>
                                  <span className="text-neutral-400 font-mono">x{item.quantity}</span>
                                </div>
                                {item.notes && (
                                  <div className="flex items-start gap-1 text-[11px] text-[#e5b83b]/80 bg-[#e5b83b]/5 px-1.5 py-0.5 rounded mt-0.5 border border-[#e5b83b]/10">
                                    <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span className="italic">{item.notes}</span>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading States */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-neutral-600 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Loading tables...</span>
          </div>
        ) : tables.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 gap-2">
            <Armchair className="w-10 h-10" strokeWidth={1.5} />
            <span className="text-sm font-medium">No tables found</span>
          </div>
        ) : (
          /* ── Free-position drag canvas ── */
          <div
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
            style={{ position: 'relative', height: canvasHeight, minHeight: 480 }}
            className="w-full rounded-2xl border border-neutral-900/60 bg-[#0e0e10] overflow-hidden"
          >
            {/* Subtle dot-grid background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {tables.map((table) => {
              const pos = positions[table.id] ?? { x: 0, y: 0 };
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  position={pos}
                  isReadyToServe={checkTableReadyState(table.label)}
                  isDragging={draggingId === table.id}
                  onPointerDown={(e) => handlePointerDown(table.id, e)}
                  onClick={() => {
                    if (!hasDragged.current) setSelectedTable(table);
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Live Capacity Footer */}
        <div className="w-full mt-auto pt-4 border-t border-neutral-900">
          <div className="bg-[#141416] border border-neutral-900/80 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">Live Capacity Meter</span>
                <TrendingUp className="w-4 h-4 text-[#e5b83b]/70" strokeWidth={2} />
              </div>
              <span className="text-3xl font-extrabold text-[#e5b83b]">{occupancyPct}%</span>
            </div>
            <div className="mt-4">
              <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#e5b83b] rounded-full transition-all duration-700"
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-500 font-medium mt-2">
                {occupied} / {total} Active Tables Occupied
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Table Management Modal */}
      {selectedTable && (
        <TableModal
          table={selectedTable}
          tenantSlug={tenantSlug}
          role={role}
          onClose={() => setSelectedTable(null)}
          onStatusChange={handleTableStatusChange}
          onKotStatusChange={handleKotStatusChange}
        />
      )}
    </div>
  );
}