"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  Plus, X, Pencil, Trash2,
  Users, CheckCircle2, AlertCircle, HelpCircle,
  Armchair, Bookmark, Eraser, Loader2, LayoutGrid,
  Store, ChevronDown,
} from "lucide-react";

type TableStatus = "available" | "occupied" | "reserved" | "dirty";
type TableShape = "square" | "round";

interface Table {
  id: string;
  name: string;
  status: TableStatus;
  seats: number;
  shape: TableShape;
  outletId?: string;
  outletName?: string;
  positionX?: string | number;
  positionY?: string | number;
}

interface Outlet {
  id: string;
  name: string;
}

interface FormState {
  name: string;
  seats: number;
  status: TableStatus;
  shape: TableShape;
  outletId: string;
}

const EMPTY_FORM: FormState = { name: "", seats: 4, status: "available", shape: "square", outletId: "" };

const CARD_W = 140;
const CARD_H = 140;
const GRID_COLS = 6;
const GRID_GAP = 24;
const PAD = 24;

function defaultLayout(tables: Table[]): Record<string, { x: number; y: number }> {
  const layout: Record<string, { x: number; y: number }> = {};
  tables.forEach((t, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    layout[t.id] = {
      x: PAD + col * (CARD_W + GRID_GAP),
      y: PAD + row * (CARD_H + GRID_GAP),
    };
  });
  return layout;
}

function getStatusStyle(status: TableStatus) {
  switch (status) {
    case "available": return {
      border: "border-emerald-300", bg: "bg-emerald-50",
      dot: "bg-emerald-500", label: "text-emerald-700",
      icon: <Armchair className="w-8 h-8 text-emerald-600" strokeWidth={1.75} />,
    };
    case "occupied": return {
      border: "border-amber-300", bg: "bg-amber-50",
      dot: "bg-amber-500", label: "text-amber-700",
      icon: <Users className="w-8 h-8 text-amber-600" strokeWidth={1.75} />,
    };
    case "reserved": return {
      border: "border-blue-300", bg: "bg-blue-50",
      dot: "bg-blue-500", label: "text-blue-700",
      icon: <Bookmark className="w-8 h-8 text-blue-600" strokeWidth={1.75} />,
    };
    case "dirty": return {
      border: "border-slate-300", bg: "bg-slate-100",
      dot: "bg-slate-400", label: "text-slate-600",
      icon: <Eraser className="w-8 h-8 text-slate-500" strokeWidth={1.75} />,
    };
  }
}

function TableCard({
  table, position, isDragging, onPointerDown, onEdit, onDelete,
}: {
  table: Table;
  position: { x: number; y: number };
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const style = getStatusStyle(table.status);
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: CARD_W,
        height: CARD_H,
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: isDragging ? 50 : 1,
        userSelect: "none",
        touchAction: "none",
      }}
      className={`
        group aspect-square flex flex-col items-center justify-between border-2 select-none
        transition-all duration-150 shadow-sm
        ${table.shape === "round" ? "rounded-full" : "rounded-2xl"}
        ${style.border} ${style.bg}
        ${isDragging ? "shadow-xl scale-105 opacity-90" : "hover:shadow-md hover:-translate-y-0.5"}
      `}
    >
      {!isDragging && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-slate-400 hover:text-emerald-600 transition-all duration-150 shadow-sm z-10"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
      {!isDragging && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-slate-400 hover:text-red-500 transition-all duration-150 shadow-sm z-10"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      <div className="text-center space-y-1.5 pt-4 w-full px-2">
        <span className={`text-[11px] font-bold tracking-wider block uppercase ${style.label}`}>
          {table.name}
        </span>
        <div className="flex justify-center py-0.5">{style.icon}</div>
        <span className="text-[10px] font-bold text-slate-500 bg-white/60 rounded-full px-2.5 py-0.5 inline-block">
          {table.seats} Seats
        </span>
      </div>
      <div className="flex items-center gap-1.5 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        <span className={`text-[10px] font-semibold capitalize ${style.label}`}>{table.status}</span>
      </div>
    </div>
  );
}

export default function ManagerTablePage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [tables, setTables] = useState<Table[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOrigin = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const hasDragged = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingElementRef = useRef<HTMLElement | null>(null);
  const draggedPositionRef = useRef<{ x: number; y: number } | null>(null);
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});

  useEffect(() => { positionsRef.current = positions; }, [positions]);

  const filteredTables = tables;
  const activeOutlet = outlets.find((o) => o.id === selectedOutletId);

  // Close dropdown on outside click
  useEffect(() => {
    if (!outletDropdownOpen) return;
    const handler = () => setOutletDropdownOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [outletDropdownOpen]);

  useEffect(() => {
    if (filteredTables.length === 0) return;
    setPositions(prev => {
      const next = { ...prev };
      const defaults = defaultLayout(filteredTables);
      let changed = false;
      filteredTables.forEach(t => {
        const dbX = t.positionX !== undefined ? Number(t.positionX) : 0;
        const dbY = t.positionY !== undefined ? Number(t.positionY) : 0;
        if (draggingId === t.id) return;
        let targetX = defaults[t.id].x;
        let targetY = defaults[t.id].y;
        if (dbX !== 0 || dbY !== 0) { targetX = dbX; targetY = dbY; }
        if (!prev[t.id] || prev[t.id].x !== targetX || prev[t.id].y !== targetY) {
          next[t.id] = { x: targetX, y: targetY };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [filteredTables, draggingId]);

  const canvasHeight = Math.max(
    480,
    Object.values(positions).reduce((max, p) => Math.max(max, p.y + CARD_H + PAD), 0)
  );

  const handlePointerDown = useCallback((tableId: string, e: React.PointerEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    draggingElementRef.current = el;
    hasDragged.current = false;
    setDraggingId(tableId);
    const ox = positionsRef.current[tableId]?.x ?? 0;
    const oy = positionsRef.current[tableId]?.y ?? 0;
    dragOrigin.current = { px: e.clientX, py: e.clientY, ox, oy };
    draggedPositionRef.current = { x: ox, y: oy };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId || !dragOrigin.current || !canvasRef.current) return;
    const dx = e.clientX - dragOrigin.current.px;
    const dy = e.clientY - dragOrigin.current.py;
    if (!hasDragged.current && Math.abs(dx) + Math.abs(dy) < 4) return;
    hasDragged.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(dragOrigin.current.ox + dx, rect.width - CARD_W));
    const newY = Math.max(0, dragOrigin.current.oy + dy);
    draggedPositionRef.current = { x: newX, y: newY };
    if (draggingElementRef.current) {
      draggingElementRef.current.style.left = `${newX}px`;
      draggingElementRef.current.style.top = `${newY}px`;
    }
  }, [draggingId]);

  const stopDrag = useCallback(async () => {
    if (draggingId && hasDragged.current) {
      const pos = draggedPositionRef.current;
      if (pos) {
        setPositions(prev => ({ ...prev, [draggingId]: pos }));
        const tbl = tables.find(t => t.id === draggingId);
        try {
          await api.patch(`/tables/${draggingId}`, {
            positionX: Math.round(pos.x),
            positionY: Math.round(pos.y),
            outletId: tbl?.outletId,
          });
        } catch (err) {
          console.error("Failed to save table position:", err);
        }
      }
    }
    setDraggingId(null);
    dragOrigin.current = null;
    draggingElementRef.current = null;
    draggedPositionRef.current = null;
  }, [draggingId, tables]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") stopDrag(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stopDrag]);

  const resetLayout = async () => {
    const layout = defaultLayout(filteredTables);
    setPositions(prev => ({ ...prev, ...layout }));
    try {
      await Promise.all(
        filteredTables.map(t => {
          const pos = layout[t.id];
          return api.patch(`/tables/${t.id}`, {
            positionX: Math.round(pos.x),
            positionY: Math.round(pos.y),
            outletId: t.outletId,
          });
        })
      );
    } catch (err) {
      console.error("Failed to reset layout:", err);
    }
  };

  useEffect(() => {
    async function fetchOutlets() {
      try {
        const res = await api.get("/outlets");
        const raw = res.data.outlets ?? [];
        const mapped: Outlet[] = raw.map((o: any) => ({ id: o.id, name: o.name }));
        setOutlets(mapped);
        const savedOutletId = localStorage.getItem(`selected_outlet_${tenantSlug}`);
        const isValidSaved = savedOutletId && mapped.some(o => o.id === savedOutletId);
        const initialOutletId = isValidSaved ? savedOutletId : (mapped[0]?.id ?? "");
        if (initialOutletId) {
          setSelectedOutletId(initialOutletId);
          setForm(p => ({ ...p, outletId: initialOutletId }));
        }
      } catch (err) {
        console.error("Failed to fetch outlets:", err);
      }
    }
    fetchOutlets();
  }, [tenantSlug]);

  const fetchTables = useCallback(async (silent = false) => {
    if (!selectedOutletId) return;
    try {
      if (!silent) setIsLoading(true);
      const res = await api.get(`/tables?outletId=${selectedOutletId}`);
      const raw = res.data.tables ?? [];
      setTables(raw.map((t: any) => ({
        id: t.id,
        name: t.tableNumber ?? t.name ?? `T-${t.id}`,
        status: (t.status as TableStatus) ?? "available",
        seats: t.capacity ?? t.seats ?? 2,
        shape: (t.shape as TableShape) ?? "square",
        outletId: t.outletId ?? undefined,
        outletName: t.outletName ?? undefined,
        positionX: t.positionX,
        positionY: t.positionY,
      })));
    } catch (err: any) {
      console.error("Failed to fetch tables:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [selectedOutletId]);

  useEffect(() => {
    fetchTables(false);
    const interval = setInterval(() => fetchTables(true), 5000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  const totalCount = filteredTables.length;
  const availableCount = filteredTables.filter(t => t.status === "available").length;
  const activeAlerts = filteredTables.filter(t => t.status === "dirty" || t.status === "occupied").length;

  function openAdd() {
    setForm({ ...EMPTY_FORM, outletId: selectedOutletId });
    setEditingTable(null);
    setIsAddModalOpen(true);
  }
  function openEdit(table: Table) {
    setEditingTable(table);
    setForm({ name: table.name, seats: table.seats, status: table.status, shape: table.shape, outletId: table.outletId ?? "" });
    setIsAddModalOpen(true);
  }
  function closeModal() { setIsAddModalOpen(false); setEditingTable(null); setForm(EMPTY_FORM); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.outletId) return;
    setIsSaving(true);
    try {
      if (editingTable) {
        await api.patch(`/tables/${editingTable.id}`, {
          tableNumber: form.name.trim().toUpperCase(),
          capacity: form.seats,
          shape: form.shape,
          outletId: form.outletId,
        });
        if (editingTable.status !== form.status) {
          await api.patch(`/tables/${editingTable.id}/status`, { status: form.status, outletId: form.outletId });
        }
      } else {
        const res = await api.post("/tables", {
          tableNumber: form.name.trim().toUpperCase(),
          capacity: form.seats,
          shape: form.shape,
          outletId: form.outletId,
        });
        if (res.data?.id && form.status !== "available") {
          await api.patch(`/tables/${res.data.id}/status`, { status: form.status, outletId: form.outletId });
        }
      }
      await fetchTables();
      closeModal();
    } catch (err: any) {
      const message = err.response?.data?.error;
      alert(typeof message === "string" ? message : "Failed to save table.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const tbl = tables.find(t => t.id === id);
    if (!tbl) return;
    try {
      await api.delete(`/tables/${id}`, { params: { outletId: tbl.outletId } });
      setTables(prev => prev.filter(t => t.id !== id));
      setPositions(prev => { const next = { ...prev }; delete next[id]; return next; });
      setDeleteConfirmId(null);
    } catch (err: any) {
      const message = err.response?.data?.error;
      alert(typeof message === "string" ? message : "Failed to delete table.");
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Table Layout</h1>
          {activeOutlet && (
            <p className="text-sm text-emerald-100/80 mt-1">{activeOutlet.name}</p>
          )}
        </div>

        {/* ── Outlet picker — same custom dropdown as Menu page ── */}
        {outlets.length > 0 && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOutletDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border bg-white text-emerald-700 border-white shadow-sm"
            >
              <Store className="w-4 h-4 shrink-0" />
              <span className="max-w-[120px] truncate">
                {activeOutlet?.name ?? "Select Outlet"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${outletDropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {outletDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Outlet</p>
                </div>
                <div className="py-1">
                  {outlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      onClick={() => {
                        setSelectedOutletId(outlet.id);
                        localStorage.setItem(`selected_outlet_${tenantSlug}`, outlet.id);
                        setOutletDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${selectedOutletId === outlet.id
                          ? "bg-emerald-50 text-emerald-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOutletId === outlet.id ? "bg-emerald-500" : "bg-slate-200"}`} />
                      {outlet.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-l-4 border-l-slate-400 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tables</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{totalCount}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <HelpCircle className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{availableCount}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Busy / Dirty</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{activeAlerts}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Legend + toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>Available</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>Occupied</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span>Reserved</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /><span>Dirty</span></div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetLayout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500 transition-all"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={2} />
            <span className="hidden md:inline">Reset Layout</span>
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all"
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Add Table
          </button>
        </div>
      </div>

      {/* Canvas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Loading tables...</span>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">No tables found for this outlet.</p>
        </div>
      ) : (
        <div
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerLeave={stopDrag}
          style={{ position: "relative", height: canvasHeight, minHeight: 480 }}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {filteredTables.map(table => {
            const isCurrentDragging = draggingId === table.id;
            const pos = isCurrentDragging
              ? (draggedPositionRef.current ?? positions[table.id] ?? { x: 0, y: 0 })
              : (positions[table.id] ?? { x: 0, y: 0 });
            return (
              <TableCard
                key={table.id}
                table={table}
                position={pos}
                isDragging={isCurrentDragging}
                onPointerDown={e => handlePointerDown(table.id, e)}
                onEdit={() => { if (!hasDragged.current) openEdit(table); }}
                onDelete={() => { if (!hasDragged.current) setDeleteConfirmId(table.id); }}
              />
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
            <div className="flex flex-col items-center text-center gap-3 p-6 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Table?</h3>
                <p className="text-sm text-slate-500">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 p-6">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-sm py-2.5 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white border border-slate-200 w-full max-w-md rounded-t-2xl sm:rounded-xl shadow-xl overflow-y-auto max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative flex flex-col items-center justify-center p-5 bg-emerald-600 text-white shrink-0">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Users className="h-6 w-6 text-white mb-0.5" />
                <h3 className="text-xl font-semibold text-white">
                  {editingTable ? "Edit Table" : "Add New Table"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Outlet Branch</label>
                  <select
                    disabled={!!editingTable}
                    value={form.outletId}
                    onChange={e => setForm(p => ({ ...p, outletId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Table Name</label>
                    <input
                      type="text" required
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Seats</label>
                    <input
                      type="number" min={1} required
                      value={form.seats}
                      onChange={e => setForm(p => ({ ...p, seats: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Shape</label>
                    <select
                      value={form.shape}
                      onChange={e => setForm(p => ({ ...p, shape: e.target.value as TableShape }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="square">Square</option>
                      <option value="round">Round</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(p => ({ ...p, status: e.target.value as TableStatus }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="dirty">Dirty</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100 pb-6 sm:pb-0">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSaving ? "Saving..." : editingTable ? "Save Changes" : "Add Table"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}