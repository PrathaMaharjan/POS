"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Circle, Square, Plus, X, Pencil, Trash2,
  Users, CheckCircle2, AlertCircle, HelpCircle,
  Armchair, Bookmark, Eraser, Loader2,
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

interface FormState {
  name: string;
  seats: number;
  status: TableStatus;
  shape: TableShape;
}

const EMPTY_FORM: FormState = {
  name: "",
  seats: 4,
  status: "available",
  shape: "square",
};

export default function ManagerTablePage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

 
  useEffect(() => {
    fetchTables();
  }, []);

  async function fetchTables() {
    try {
      setIsLoading(true);
      const res = await api.get("/tables");
      const raw = res.data.tables ?? [];

      const mapped: Table[] = raw.map((t: any) => ({
        id: t.id,
        name: t.tableNumber ?? t.name ?? `T-${t.id}`,
        status: (t.status as TableStatus) ?? "available",
        seats: t.capacity ?? t.seats ?? 2,
        shape: (t.shape as TableShape) ?? "square",
      }));

      setTables(mapped);
    } catch (err: any) {
      console.error("Failed to fetch tables:", err);
      alert(err.response?.data?.error ?? "Failed to load tables");
    } finally {
      setIsLoading(false);
    }
  }

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


  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);

    try {
      if (editingTable) {
        // 1. Update basic table properties
        await api.patch(`/tables/${editingTable.id}`, {
          tableNumber: form.name.trim().toUpperCase(),
          capacity: form.seats,
          shape: form.shape,
        });

        // 2. Update status if it has changed
        if (editingTable.status !== form.status) {
          await api.patch(`/tables/${editingTable.id}/status`, {
            status: form.status,
          });
        }
      } else {
        // 1. Create the new table
        const res = await api.post("/tables", {
          tableNumber: form.name.trim().toUpperCase(),
          capacity: form.seats,
          shape: form.shape,
        });

        // 2. Set the status if not available
        if (res.data?.id && form.status !== "available") {
          await api.patch(`/tables/${res.data.id}/status`, {
            status: form.status,
          });
        }
      }

      await fetchTables(); 
      closeModal();
    } catch (err: any) {
      console.error("Failed to save table:", err);
      const message = err.response?.data?.error;
      alert(typeof message === "string" ? message : "Failed to save table. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/tables/${id}`);
      setTables((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error("Failed to delete table:", err);
      const message = err.response?.data?.error;
      alert(typeof message === "string" ? message : "Failed to delete table. Please try again.");
    }
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

      {/* Legend + Add button */}
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
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Loading tables...</span>
        </div>
      ) : (
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
      )}

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
                      placeholder=""
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