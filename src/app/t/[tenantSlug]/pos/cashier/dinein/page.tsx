"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';

type TableStatus = 'available' | 'occupied' | 'reserved' | 'dirty';
type TableShape = 'square' | 'round';

interface ActiveFoodStatus {
  id: string;
  orderNumber: number;
  tableName: string;
  type: 'DINE_IN' | 'TAKEAWAY';
  ticketState: 'PENDING' | 'PREPARING' | 'DONE';
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

function TableCard({
  table,
  isReadyToServe,
  onClick,
}: {
  table: Table;
  isReadyToServe: boolean;
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
      onClick={onClick}
      className={`
        group relative flex flex-col items-center justify-center text-center cursor-pointer
        bg-[#141416] border transition-all duration-300 p-5 gap-3 w-full aspect-square select-none
        ${isRound ? 'rounded-full' : 'rounded-2xl'}
        ${isReadyToServe
          ? 'border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.35)] animate-[pulse_1.8s_infinite] scale-[1.02]'
          : `${cfg.borderColor} ${cfg.shadowColor} hover:-translate-y-1`}
      `}
    >
      {isReadyToServe && (
        <span className="absolute -top-2 bg-[#22c55e] text-[#0a1a0f] text-[9px] font-black tracking-wider px-2 py-0.5 rounded-md uppercase shadow-lg">
          READY
        </span>
      )}
      <span className="text-[12px] font-medium text-neutral-400 tracking-wider uppercase group-hover:text-white transition-colors">
        {table.label}
      </span>
      {renderStatusIcon()}
      <div className="min-h-[24px] flex items-center justify-center w-full mt-1">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-900/60 border border-neutral-800 rounded-full">
          <span className="text-[11px] font-medium text-neutral-400 tracking-wide">
            {table.seats} Seats
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Tables({ tenantSlug, role = 'cashier' }: TablesProps) {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<ActiveFoodStatus[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [confirmingTakeawayId, setConfirmingTakeawayId] = useState<string | null>(null);

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
          return {
            id: ticket.id,
            orderNumber: dbOrder.orderNumber ?? 0,
            tableName: dbOrder.table?.tableNumber ?? dbOrder.customerName ?? 'Table',
            type: dbOrder.orderType === 'takeaway' ? 'TAKEAWAY' : 'DINE_IN',
            ticketState: (ticket.status === 'ready' ? 'DONE' : (ticket.status?.toUpperCase() ?? 'PENDING')) as ActiveFoodStatus['ticketState'],
          };
        });
      setActiveOrders(mapped);
    } catch (err) {
      console.error("Failed to fetch KOT tickets for table status:", err);
    }
  }

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKotStatusChange = (ticketId: string, nextStatus: string) => {
    setActiveOrders(prev => {
      if (nextStatus === 'served') {
        return prev.filter(order => order.id !== ticketId);
      }
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
    } catch (err) {
      console.error("Failed to dismiss takeaway ticket:", err);
    }
    setConfirmingTakeawayId(null);
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
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

        {/* Filters and Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-[#141416]/40 border border-neutral-900/60 rounded-2xl px-5 py-3.5">
          <div className="flex items-center flex-wrap gap-3">
            {(Object.keys(STATUS_CONFIG) as TableStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-2 bg-[#0c0c0d]/60 px-3 py-1.5 rounded-lg border border-neutral-900/80">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dotColor}`} />
                <span className="text-xs font-semibold text-neutral-400 tracking-wide">{STATUS_CONFIG[s].label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (role === 'cashier') {
                router.push(`/t/${safeSlug}/pos/cashier`);
              } else {
                router.push(`/t/${safeSlug}/pos`);
              }
            }}
            className="flex items-center gap-2 bg-[#141416] border border-neutral-800 hover:border-[#e5b83b]/60 text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-150 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Go Back
          </button>
        </div>

        {/* Takeaway pickup panel */}
        {role === 'cashier' && readyTakeaways.length > 0 && (
          <div className="bg-[#141416] border border-neutral-900 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-black tracking-wider text-neutral-400 uppercase">
              <span>Takeaway Pickup Queue</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {readyTakeaways.map((order) => {
                const isConfirming = confirmingTakeawayId === order.id;
                return (
                  <div
                    key={order.id}
                    className={`flex items-center gap-3 border px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${isConfirming
                        ? 'bg-[#3b1c1c] border-red-500/40 text-red-400'
                        : 'bg-[#162e1a] border-[#22c55e]/30 text-green-400'
                      }`}
                  >
                    <span>Order #{order.orderNumber}</span>
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDismissTakeaway(order.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md font-black text-[10px] uppercase transition-colors"
                        >
                          Confirm Handout
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
                        className="bg-[#22c55e] hover:bg-[#16a34a] text-[#0a1a0f] px-2 py-1 rounded-md font-black text-[10px] uppercase transition-colors"
                      >
                        Handout Complete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Grid display area */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 flex-1 content-start py-2">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                isReadyToServe={checkTableReadyState(table.label)}
                onClick={() => handleTableClick(table)}
              />
            ))}
          </div>
        )}

        {/* Metric footer banner */}
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

      {/* Table Detail Dialog Overlay */}
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