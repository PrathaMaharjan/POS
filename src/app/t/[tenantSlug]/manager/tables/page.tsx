"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api"; 
import { 
  Loader2, 
  RefreshCw, 
  Circle, 
  Square,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";

type TableStatus = "available" | "occupied" | "reserved" | "dirty";

interface Table {
  id: string;
  name: string;
  status: TableStatus;
  seats?: number;
  shape?: "square" | "round";
}

export default function ManagerTablePage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/tables");
      const data = Array.isArray(response.data) ? response.data : (response.data?.tables || []);
      setTables(data);
    } catch (err: any) {
      console.error("Error fetching tables:", err);
      setError(err.response?.data?.error || "Failed to populate current floorplan blueprints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleStatusChange = async (tableId: string, newStatus: TableStatus) => {
    setUpdatingId(tableId);
    try {
      const response = await api.patch(`/tables/${tableId}`, {
        status: newStatus,
      });
      
      const updatedTable = response.data?.table;
      setTables((prevTables) =>
        prevTables.map((t) =>
          t.id === tableId ? { ...t, status: updatedTable?.status || newStatus } : t
        )
      );
    } catch (err: any) {
      console.error("Error updating table status:", err);
      alert(err.response?.data?.error || "Status modifications rejected.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddTable = () => {
    // Hook up modal state trigger or routing here
    console.log("Trigger add table workflow configuration.");
  };

  // Metrical summary calculations
  const totalCount = tables.length;
  const availableCount = tables.filter(t => t.status === "available").length;
  const activeAlerts = tables.filter(t => t.status === "dirty" || t.status === "occupied").length;

  return (
    <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
      
      {/* Upper Status Panel Grid */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Table Layout Console</h1>
          <p className="text-sm text-emerald-100/80 mt-1">Live tracking and capacity distribution</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Add Table Button */}
          <button
            onClick={handleAddTable}
            className="flex items-center gap-2 rounded-lg bg-white text-emerald-700 hover:bg-emerald-50 active:scale-95 px-4 py-2 text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add Table
          </button>

          <button
            onClick={fetchTables}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 active:scale-95 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
            Sync Floor
          </button>
        </div>
      </div>

      {/* Mini Analytical Dashboards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Layout Hubs</p>
            <p className="text-xl font-bold text-slate-800">{totalCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open Seating Slots</p>
            <p className="text-xl font-bold text-slate-800">{availableCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Busy / Dirty Sectors</p>
            <p className="text-xl font-bold text-slate-800">{activeAlerts}</p>
          </div>
        </div>
      </div>

      {/* Filter Quick-Legend Row */}
      <div className="flex items-center gap-6 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 w-max">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> <span>Available</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> <span>Occupied</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> <span>Reserved</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> <span>Dirty</span></div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Structural Layout Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {tables.map((table) => {
            const isAvailable = table.status === "available";
            const isOccupied = table.status === "occupied";
            const isReserved = table.status === "reserved";

            // Determine border and color profiling context
            let statusColorClass = "border-slate-200";
            let iconColorClass = "text-slate-400 fill-slate-50/50";
            if (isAvailable) { statusColorClass = "border-emerald-200"; iconColorClass = "text-emerald-500 fill-emerald-50/30"; }
            if (isOccupied) { statusColorClass = "border-amber-200 bg-amber-50/10"; iconColorClass = "text-amber-500 fill-amber-50/30"; }
            if (isReserved) { statusColorClass = "border-blue-200 bg-blue-50/10"; iconColorClass = "text-blue-500 fill-blue-50/30"; }

            return (
              <div
                key={table.id}
                className={`aspect-square p-4 flex flex-col items-center justify-between border bg-white transition-all select-none group relative shadow-sm hover:shadow-md rounded-2xl ${statusColorClass}`}
              >
                <div className="text-center space-y-2 pt-2 w-full">
                  <span className="text-xs font-bold tracking-wider block text-slate-500 group-hover:text-slate-900 transition-colors uppercase">
                    {table.name || `T-${table.id.slice(-2)}`}
                  </span>

                  <div className="flex justify-center text-slate-400 py-1">
                    {table.shape === "round" ? (
                      <Circle className={`w-8 h-8 ${iconColorClass}`} strokeWidth={1.5} />
                    ) : (
                      <Square className={`w-8 h-8 ${iconColorClass}`} strokeWidth={1.5} />
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5 inline-block">
                    {table.seats || 4} Seats
                  </span>
                </div>

                {/* Control Action Switcher Selector */}
                <div className="w-full mt-3 pt-2 border-t border-slate-100">
                  <select
                    value={table.status}
                    disabled={updatingId === table.id}
                    onChange={(e) => handleStatusChange(table.id, e.target.value as TableStatus)}
                    className="w-full text-center rounded-lg border border-slate-200 bg-slate-50/80 px-1 py-1 text-[11px] font-medium text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="dirty">Dirty</option>
                  </select>
                </div>

                {/* Inline Processing Mask Overlays */}
                {updatingId === table.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-xs">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
            );
          })}

          {tables.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <p className="text-sm text-slate-400 font-medium">No deployed system tables tracked inside this active outlet zone.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}