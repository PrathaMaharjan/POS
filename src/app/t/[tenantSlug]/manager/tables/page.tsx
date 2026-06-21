"use client";

import { useState } from "react";
import {
  Circle, Square, Plus, X, Pencil, Trash2,
  Users, CheckCircle2, AlertCircle, HelpCircle,
  Armchair, Bookmark, Eraser,
} from "lucide-react";

type TableStatus = "available" | "occupied" | "reserved" | "dirty";
type TableShape = "square" | "round";

interface Table {
  id: string;
  name: string;
  status: TableStatus;
  seats: number;
  shape: TableShape;
}

const SEED_TABLES: Table[] = [
  { id: "1", name: "T-01", status: "available", seats: 4, shape: "square" },
  { id: "2", name: "T-02", status: "occupied", seats: 2, shape: "round" },
  { id: "3", name: "T-03", status: "reserved", seats: 6, shape: "square" },
  { id: "4", name: "T-04", status: "dirty", seats: 4, shape: "round" },
  { id: "5", name: "T-05", status: "available", seats: 8, shape: "square" },
  { id: "6", name: "T-06", status: "available", seats: 2, shape: "round" },
];

const EMPTY_FORM = { name: "", seats: 4, status: "available" as TableStatus, shape: "square" as TableShape };

export default function ManagerTablePage() {
  const [tables, setTables] = useState<Table[]>(SEED_TABLES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const totalCount = tables.length;
  const availableCount = tables.filter((t) => t.status === "available").length;
  const activeAlerts = tables.filter((t) => t.status === "dirty" || t.status === "occupied").length;

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingTable(null);
    setIsAddModalOpen(true);
  }

  function openEdit(table: Table) {
    setEditingTable(table);
    setForm({ name: table.name, seats: table.seats, status: table.status, shape: table.shape });
    setIsAddModalOpen(true);
  }

  function closeModal() {
    setIsAddModalOpen(false);
    setEditingTable(null);
    setForm(EMPTY_FORM);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === editingTable.id
            ? { ...t, name: form.name.toUpperCase(), seats: form.seats, status: form.status, shape: form.shape }
            : t
        )
      );
    } else {
      setTables((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: form.name.toUpperCase(),
          seats: form.seats,
          status: form.status,
          shape: form.shape,
        },
      ]);
    }
    closeModal();
  }

  function handleDelete(id: string) {
    setTables((prev) => prev.filter((t) => t.id !== id));
    setDeleteConfirmId(null);
  }

 function getStatusStyle(status: TableStatus) {
  switch (status) {
    case "available": return {
      border: "border-emerald-300",
      bg: "bg-emerald-50",
      dot: "bg-emerald-500",
      label: "text-emerald-700",
      icon: <Armchair className="w-8 h-8 text-emerald-600" strokeWidth={1.75} />,
    };
    case "occupied": return {
      border: "border-amber-300",
      bg: "bg-amber-50",
      dot: "bg-amber-500",
      label: "text-amber-700",
      icon: <Users className="w-8 h-8 text-amber-600" strokeWidth={1.75} />,
    };
    case "reserved": return {
      border: "border-blue-300",
      bg: "bg-blue-50",
      dot: "bg-blue-500",
      label: "text-blue-700",
      icon: <Bookmark className="w-8 h-8 text-blue-600" strokeWidth={1.75} />,
    };
    case "dirty": return {
      border: "border-slate-300",
      bg: "bg-slate-100",
      dot: "bg-slate-400",
      label: "text-slate-600",
      icon: <Eraser className="w-8 h-8 text-slate-500" strokeWidth={1.75} />,
    };
  }
}

  function getIconStyle(status: TableStatus) {
    switch (status) {
      case "available": return "text-emerald-500";
      case "occupied":  return "text-amber-500";
      case "reserved":  return "text-blue-500";
      case "dirty":     return "text-slate-400";
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Table Layout</h1>

        </div>
    
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tables</p>
            <p className="text-xl font-bold text-slate-800">{totalCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available</p>
            <p className="text-xl font-bold text-slate-800">{availableCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Busy / Dirty</p>
            <p className="text-xl font-bold text-slate-800">{activeAlerts}</p>
          </div>
        </div>
      </div>



<div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
  <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>Available</span></div>
    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>Occupied</span></div>
    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span>Reserved</span></div>
    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /><span>Dirty</span></div>
  </div>
<button
  onClick={openAdd}
  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3 py-2 md:px-4 md:py-2 text-sm font-semibold text-white shadow-sm transition-all"
>
  <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
  <span className="hidden md:inline">Add Table</span>
</button>
</div>

      {/* Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
       {tables.map((table) => {
  const style = getStatusStyle(table.status);

  return (
    <div
      key={table.id}
      className={`aspect-square p-4 flex flex-col items-center justify-between border-2 transition-all select-none group relative shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
        table.shape === "round" ? "rounded-full" : "rounded-2xl"
      } ${style.border} ${style.bg}`}
    >
      {/* Edit button */}
      <button
        onClick={() => openEdit(table)}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-slate-400 hover:text-emerald-600 transition-all duration-150 shadow-sm"
      >
        <Pencil className="w-3 h-3" />
      </button>

      {/* Delete button */}
      <button
        onClick={() => setDeleteConfirmId(table.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-slate-400 hover:text-red-500 transition-all duration-150 shadow-sm"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      <div className="text-center space-y-2 pt-2 w-full">
        <span className={`text-xs font-bold tracking-wider block uppercase ${style.label}`}>
          {table.name}
        </span>

        <div className="flex justify-center py-1">
          {style.icon}
        </div>

        <span className="text-[10px] font-bold text-slate-500 bg-white/60 rounded-full px-2.5 py-0.5 inline-block">
          {table.seats} Seats
        </span>
      </div>

      {/* Status dot */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        <span className={`text-[10px] font-semibold capitalize ${style.label}`}>{table.status}</span>
      </div>
    </div>
  );
})} 

        {tables.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <p className="text-sm text-slate-400 font-medium">No tables yet. Click "Add Table" to get started.</p>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
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
        <button
          onClick={() => setDeleteConfirmId(null)}
          className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-sm py-2.5 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => handleDelete(deleteConfirmId)}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Green header */}
            <div className="relative flex items-center justify-center p-6 bg-emerald-600 rounded-t-xl">
              <div className="flex flex-col items-center text-center">
                <Users className="h-7 w-7 text-white mb-1" />
                <h3 className="text-xl font-semibold text-white">
                  {editingTable ? "Edit Table" : "Add New Table"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="absolute right-6 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Table Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. T-09"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Seats
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={form.seats}
                      onChange={(e) => setForm((p) => ({ ...p, seats: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Shape
                    </label>
                    <select
                      value={form.shape}
                      onChange={(e) => setForm((p) => ({ ...p, shape: e.target.value as TableShape }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="square">Square</option>
                      <option value="round">Round</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as TableStatus }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="dirty">Dirty</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-medium text-white shadow-sm transition-colors"
                  >
                    {editingTable ? "Save Changes" : "Add Table"}
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