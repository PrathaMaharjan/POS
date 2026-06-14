"use client";

import React, { useState } from "react";

interface Outlet {
  id: number;
  name: string;
  address: string;
  phone: string;
}

// ─── Mock data – replace with your DB fetch ──────────────────────────────────
const MOCK_OUTLETS: Outlet[] = [
  { id: 1, name: "Main Street Branch", address: "123 Durbar Marg, Kathmandu", phone: "+977 9801234567" },
  { id: 2, name: "Thamel Outlet", address: "45 Tridevi Marg, Thamel, Kathmandu", phone: "+977 9807654321" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-800/60 rounded-lg px-4 py-3">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
      <p className="text-xl font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function OutletCard({
  outlet,
  onEdit,
  onDelete,
}: {
  outlet: Outlet;
  onEdit: (o: Outlet) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {outlet.name}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
            Active
          </span>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5">
            <MapPinIcon />
            <span>{outlet.address}</span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <PhoneIcon />
            <span>{outlet.phone}</span>
          </p>
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => onEdit(outlet)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-150"
          title="Edit outlet"
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(outlet.id)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150"
          title="Delete outlet"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function InlineEditCard({
  outlet,
  onSave,
  onCancel,
}: {
  outlet: Outlet;
  onSave: (updated: Outlet) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(outlet.name);
  const [address, setAddress] = useState(outlet.address);
  const [phone, setPhone] = useState(outlet.phone);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-600 rounded-xl p-5 space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Outlet name"
        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-all duration-150"
      />
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address"
        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-all duration-150"
      />
      <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone"
        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-all duration-150"
      />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave({ ...outlet, name, address, phone })}
          disabled={!name.trim() || !address.trim() || !phone.trim()}
          className="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-medium uppercase tracking-wider py-2 rounded-lg disabled:opacity-30 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-all duration-150"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-[11px] font-medium uppercase tracking-wider py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-150"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

// ─── Add Outlet Form (right panel) ────────────────────────────────────────────

function AddOutletForm({ onAdd }: { onAdd: (o: Omit<Outlet, "id">) => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({ name: false, address: false, phone: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const newErrors = {
      name: !name.trim(),
      address: !address.trim(),
      phone: !phone.trim(),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setIsSubmitting(true);
    // TODO: replace with your Server Action / API route
    await new Promise((r) => setTimeout(r, 400));
    onAdd({ name: name.trim(), address: address.trim(), phone: phone.trim() });
    setName("");
    setAddress("");
    setPhone("");
    setErrors({ name: false, address: false, phone: false });
    setIsSubmitting(false);
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-zinc-50/50 dark:bg-zinc-800/50 border rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 outline-none transition-all duration-150 ${
      hasError
        ? "border-red-400 dark:border-red-600 focus:border-red-500"
        : "border-zinc-200 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-400 focus:bg-white dark:focus:bg-zinc-900"
    }`;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sticky top-6">
      <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-medium mb-1">
        New outlet
      </p>
      <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">
        Add location
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
        Register a new branch or physical store.
      </p>

      <hr className="border-zinc-100 dark:border-zinc-800 mb-5" />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider font-medium text-zinc-500 dark:text-zinc-400">
            Outlet name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g., Main Street Branch"
            className={inputClass(errors.name)}
          />
          {errors.name && (
            <p className="text-[11px] text-red-500">Outlet name is required.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider font-medium text-zinc-500 dark:text-zinc-400">
            Physical address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setErrors((p) => ({ ...p, address: false })); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g., 123 Durbar Marg, Kathmandu"
            className={inputClass(errors.address)}
          />
          {errors.address && (
            <p className="text-[11px] text-red-500">Address is required.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider font-medium text-zinc-500 dark:text-zinc-400">
            Contact phone
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: false })); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g., +977 9801234567"
            className={inputClass(errors.phone)}
          />
          {errors.phone && (
            <p className="text-[11px] text-red-500">Phone number is required.</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-medium py-2.5 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-all duration-150 disabled:opacity-40 uppercase tracking-wider mt-1"
        >
          {isSubmitting ? "Adding…" : "Add outlet"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>(MOCK_OUTLETS);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(MOCK_OUTLETS.length + 1);

  const handleAdd = (data: Omit<Outlet, "id">) => {
    // TODO: call your Server Action to insert into the DB, then refresh
    setOutlets((prev) => [...prev, { id: nextId, ...data }]);
    setNextId((n) => n + 1);
  };

  const handleSave = (updated: Outlet) => {
    // TODO: call your Server Action to update the DB row
    setOutlets((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    // TODO: call your Server Action to delete from the DB
    setOutlets((prev) => prev.filter((o) => o.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const uniqueCities = new Set(outlets.map((o) => o.address.split(",").pop()?.trim())).size;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      {/* Page header */}
      <div className="mb-7">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-medium mb-1">
          Configuration
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Outlets
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your physical locations, addresses, and contact details.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-7">
        <StatCard label="Total outlets" value={outlets.length} />
        <StatCard label="Active branches" value={outlets.length} />
        <StatCard label="Cities covered" value={uniqueCities} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left – outlet list */}
        <div className="space-y-3">
          {outlets.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-10 text-center">
              <p className="text-3xl mb-3">🏪</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No outlets yet. Add your first location →
              </p>
            </div>
          ) : (
            outlets.map((outlet) =>
              editingId === outlet.id ? (
                <InlineEditCard
                  key={outlet.id}
                  outlet={outlet}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <OutletCard
                  key={outlet.id}
                  outlet={outlet}
                  onEdit={(o) => setEditingId(o.id)}
                  onDelete={handleDelete}
                />
              )
            )
          )}
        </div>

        {/* Right – add form */}
        <AddOutletForm onAdd={handleAdd} />
      </div>
    </div>
  );
}

// ─── Inline SVG icons (no extra dep) ─────────────────────────────────────────

function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.62 5 2 2 0 0 1 3.58 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6.06 6.06l1.96-1.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}