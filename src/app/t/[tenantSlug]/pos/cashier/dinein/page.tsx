"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TableModal from '../../_components/TableModal';

type TableStatus = 'available' | 'occupied';
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
  { id: 3,  label: 'T-03', status: 'available', shape: 'square', seats: 4 },
  { id: 4,  label: 'T-04', status: 'occupied',  shape: 'square', seats: 6 },
  { id: 5,  label: 'T-05', status: 'available', shape: 'round',  seats: 2 },
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
};

function ChairIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M5 9V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v5" />
      <path d="M3 9h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <path d="M7 13v6M17 13v6M5 19h14" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

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

      {table.status === 'occupied' ? (
        <UsersIcon className={`w-7 h-7 ${isReadyToServe ? 'text-[#22c55e]' : cfg.iconColor}`} />
      ) : (
        <ChairIcon className={`w-7 h-7 ${cfg.iconColor}`} />
      )}

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
  const [tables] = useState<Table[]>(MOCK_TABLES);
  const [activeOrders, setActiveOrders] = useState<ActiveFoodStatus[]>(INITIAL_KITCHEN_ORDERS);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const occupied = tables.filter(t => t.status === 'occupied').length;
  const total = tables.length;
  const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  // Waiters get the physical table alerts for food run notifications
  const checkTableReadyState = (tableLabel: string) => {
    if (role !== 'waiter') return false;
    return activeOrders.some(
      order => order.tableName === tableLabel && order.ticketState === 'DONE' && order.type === 'DINE_IN'
    );
  };

  const handleDismissTakeaway = (id: number) => {
    setActiveOrders(prev => prev.filter(order => order.id !== id));
  };

  const handleTableClick = (table: Table) => {
    if (role === 'waiter' && checkTableReadyState(table.label)) {
      setActiveOrders(prev => prev.filter(order => !(order.tableName === table.label && order.type === 'DINE_IN')));
    }
    setSelectedTable(table);
  };

  // Extract completed takeaways for the cashier's front shelf counter
  const readyTakeaways = activeOrders.filter(o => o.type === 'TAKEAWAY' && o.ticketState === 'DONE');

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-[#e4e4e7] flex flex-col font-sans select-none antialiased">
      <main className="flex-1 flex flex-col px-8 py-6 gap-6 max-w-[1400px] mx-auto w-full">
        
        {/* Navigation / Control Panel Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-[#141416]/40 border border-neutral-900/60 rounded-2xl px-5 py-3.5">
          <div className="flex items-center gap-4">
          
            
            {/* Status Indicators */}
            {(['available', 'occupied'] as TableStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-2 bg-[#0c0c0d]/60 px-3 py-1.5 rounded-lg border border-neutral-900">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dotColor}`} />
                <span className="text-xs font-medium text-neutral-400">{STATUS_CONFIG[s].label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.back()} 
            className="flex items-center gap-2 bg-[#141416] border border-neutral-800 hover:border-[#e5b83b]/60 text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-150 shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Go Back
          </button>
        </div>

        {/* Real-time Takeaway Shelf (Now dedicated exclusively to Cashier View) */}
        {role === 'cashier' && readyTakeaways.length > 0 && (
          <div className="bg-[#141416] border border-neutral-900 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-black tracking-wider text-neutral-400 uppercase">
              <span>Takeaway Pickup Queue</span>
              <span className="flex h-2 w-2 relative">
              

              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {readyTakeaways.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center gap-3 bg-[#162e1a] border border-[#22c55e]/30 px-3.5 py-1.5 rounded-xl text-xs font-bold text-green-400 animate-slide-up"
                >
                  <span>Order #{order.orderNumber}</span>
                  <button 
                    onClick={() => handleDismissTakeaway(order.id)}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-[#0a1a0f] px-2 py-1 rounded-md font-black text-[10px] uppercase transition-colors"
                  >
                    Handout Complete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floor Map Layout */}
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

        {/* Analytics Summary Banner */}
        <div className="w-full mt-auto pt-4 border-t border-neutral-900">
          <div className="bg-[#141416] border border-neutral-900/80 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">Live Capacity Meter</span>
                <svg className="w-4 h-4 text-[#e5b83b]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
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
                {occupied} / {total} Active Tables
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
        />
      )}
    </div>
  );
}