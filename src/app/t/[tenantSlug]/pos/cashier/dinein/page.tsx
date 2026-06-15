"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TableModal from '../../_components/TableModal';

import { 
  Armchair, 
  Users, 
  Bookmark, 
  Eraser, 
  ArrowLeft, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';

type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';
type TableShape = 'square' | 'round';

interface ActiveFoodStatus {
  id: number;
  orderNumber: number;
  tableName: string;
  type: 'DINE_IN' | 'TAKEAWAY';
  ticketState: 'PENDING' | 'PREPARING' | 'DONE';
}

interface Table {
  id: number;
  label: string;
  status: TableStatus;
  shape: TableShape;
  seats: number;
}

interface TablesProps {
  tenantSlug: string;
  role?: 'cashier' | 'waiter'; 
}

const MOCK_TABLES: Table[] = [
  { id: 1,  label: 'T-01', status: 'available', shape: 'square', seats: 2 },
  { id: 2,  label: 'T-02', status: 'occupied',  shape: 'round',  seats: 4 },
  { id: 3,  label: 'T-03', status: 'reserved',  shape: 'square', seats: 4 }, 
  { id: 4,  label: 'T-04', status: 'occupied',  shape: 'square', seats: 6 },
  { id: 5,  label: 'T-05', status: 'cleaning',  shape: 'round',  seats: 2 }, 
  { id: 6,  label: 'T-06', status: 'available', shape: 'square', seats: 4 },
  { id: 7,  label: 'T-07', status: 'occupied',  shape: 'round',  seats: 4 },
  { id: 8,  label: 'T-08', status: 'available', shape: 'square', seats: 8 },
  { id: 9,  label: 'T-09', status: 'available', shape: 'round',  seats: 2 },
  { id: 10, label: 'T-10', status: 'occupied',  shape: 'square', seats: 4 },
  { id: 11, label: 'T-11', status: 'available', shape: 'square', seats: 6 },
  { id: 12, label: 'T-12', status: 'available', shape: 'round',  seats: 2 },
];

const INITIAL_KITCHEN_ORDERS: ActiveFoodStatus[] = [
  { id: 1, orderNumber: 1014, type: 'DINE_IN', tableName: 'T-04', ticketState: 'DONE' },
  { id: 2, orderNumber: 1015, type: 'TAKEAWAY', tableName: '', ticketState: 'DONE' },
  { id: 4, orderNumber: 1011, type: 'DINE_IN', tableName: 'T-10', ticketState: 'DONE' },
  { id: 5, orderNumber: 1017, type: 'TAKEAWAY', tableName: '', ticketState: 'DONE' },
];

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
  cleaning: {
    borderColor: 'border-[#e5b83b]/30 hover:border-[#e5b83b]/60',
    shadowColor: 'hover:shadow-[0_0_15px_rgba(229,184,59,0.15)]',
    iconColor: 'text-[#e5b83b]',
    label: 'Cleaning',
    dotColor: 'bg-[#e5b83b]',
  },
};

function TableCard({ 
  table, 
  isReadyToServe, 
  onClick 
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
      case 'cleaning': return <Eraser className={`w-7 h-7 ${cfg.iconColor}`} strokeWidth={1.75} />;
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
  const [tables, setTables] = useState<Table[]>(MOCK_TABLES);
  const [activeOrders, setActiveOrders] = useState<ActiveFoodStatus[]>(INITIAL_KITCHEN_ORDERS);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  const [confirmingTakeawayId, setConfirmingTakeawayId] = useState<number | null>(null);

  const occupied = tables.filter(t => t.status === 'occupied').length;
  const total = tables.length;
  const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const checkTableReadyState = (tableLabel: string) => {
    if (role !== 'waiter') return false;
    return activeOrders.some(
      order => order.tableName === tableLabel && order.ticketState === 'DONE' && order.type === 'DINE_IN'
    );
  };

  const handleDismissTakeaway = (id: number) => {
    setActiveOrders(prev => prev.filter(order => order.id !== id));
    setConfirmingTakeawayId(null);
  };

  const handleTableClick = (table: Table) => {
    // Alert prompt removed completely. Clicking directly launches the operational modal view layout now.
    setSelectedTable(table);
  };

  const handleTableStatusChange = (tableId: number, nextStatus: TableStatus) => {
    setTables(prevTables => 
      prevTables.map(t => t.id === tableId ? { ...t, status: nextStatus } : t)
    );
    setSelectedTable(prev => prev && prev.id === tableId ? { ...prev, status: nextStatus } : prev);
  };

  const readyTakeaways = activeOrders.filter(o => o.type === 'TAKEAWAY' && o.ticketState === 'DONE');
  const safeSlug = tenantSlug && tenantSlug !== "undefined" ? tenantSlug : "default";

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-[#e4e4e7] flex flex-col font-sans select-none antialiased">
      <main className="flex-1 flex flex-col px-8 py-6 gap-6 max-w-[1400px] mx-auto w-full">
        

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
                router.push(`/${safeSlug}/pos/cashier`);
              } else {
                router.push(`/${safeSlug}/pos`);
              }
            }} 
            className="flex items-center gap-2 bg-[#141416] border border-neutral-800 hover:border-[#e5b83b]/60 text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-150 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Go Back
          </button>
        </div>


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
                    className={`flex items-center gap-3 border px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                      isConfirming 
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

      {selectedTable && (
        <TableModal
          table={selectedTable}
          tenantSlug={tenantSlug}
          onClose={() => setSelectedTable(null)}
          onStatusChange={handleTableStatusChange}
        />
      )}
    </div>
  );
}