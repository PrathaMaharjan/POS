"use client";

import { useState } from "react";
import {
  User, Mail, Lock, Store, MapPin, Percent,
  Eye, EyeOff, Loader2, CheckCircle2, Building2, ChevronDown,
} from "lucide-react";

type Section = "account" | "outlet" | null;

export default function SettingsPage() {
  const [openSection, setOpenSection] = useState<Section>("account");

  // Account form state
  const [account, setAccount] = useState({
    name: "Admin User",
    email: "admin@example.com",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  // Outlet form state
  const [outlet, setOutlet] = useState({
    name: "Green Leaf Café",
    address: "Pulchowk, Lalitpur",
    taxRate: 13,
  });

  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingOutlet, setIsSavingOutlet] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  function flashSaved(msg: string) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(null), 2500);
  }

  function toggleSection(section: Section) {
    setOpenSection((prev) => (prev === section ? null : section));
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingAccount(true);
    // TODO: wire up to api.patch("/account", { name, email })
    // TODO: if passwords.next, call api.patch("/account/password", {...})
    await new Promise((r) => setTimeout(r, 700));
    setIsSavingAccount(false);
    setPasswords({ current: "", next: "", confirm: "" });
    flashSaved("Account settings updated.");
  }

  async function handleSaveOutlet(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingOutlet(true);
    // TODO: wire up to api.patch("/outlet", { name, address, taxRate })
    await new Promise((r) => setTimeout(r, 700));
    setIsSavingOutlet(false);
    flashSaved("Outlet settings updated.");
  }

  const passwordMismatch =
    passwords.next.length > 0 &&
    passwords.confirm.length > 0 &&
    passwords.next !== passwords.confirm;

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-emerald-100/80 mt-1">
          Manage your account details and outlet configuration
        </p>
      </div>

      {/* Save confirmation toast */}
      {savedMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {savedMsg}
        </div>
      )}

      <div className="flex flex-col gap-4">

        {/* ── Account Accordion ───────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("account")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <User className="h-4 w-4" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-semibold text-slate-800">Account</h2>
                <p className="text-xs text-slate-400">Name, email, and password</p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                openSection === "account" ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`grid transition-all duration-200 ease-in-out ${
              openSection === "account" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <form onSubmit={handleSaveAccount} className="border-t border-slate-100">
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={account.name}
                        onChange={(e) => setAccount((p) => ({ ...p, name: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={account.email}
                        onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Change Password
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {([
                        { key: "current" as const, placeholder: "Current password" },
                        { key: "next" as const, placeholder: "New password" },
                        { key: "confirm" as const, placeholder: "Confirm new password" },
                      ]).map(({ key, placeholder }) => (
                        <div key={key} className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPw[key] ? "text" : "password"}
                            value={passwords[key]}
                            onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPw[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                    {passwordMismatch && (
                      <p className="text-xs text-red-500 mt-2">New passwords don't match.</p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingAccount || passwordMismatch}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingAccount && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ── Outlet Accordion ───────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("outlet")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-semibold text-slate-800">Outlet</h2>
                <p className="text-xs text-slate-400">Business name, address, and tax rate</p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                openSection === "outlet" ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`grid transition-all duration-200 ease-in-out ${
              openSection === "outlet" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <form onSubmit={handleSaveOutlet} className="border-t border-slate-100">
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Outlet Name
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={outlet.name}
                        onChange={(e) => setOutlet((p) => ({ ...p, name: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={outlet.address}
                        onChange={(e) => setOutlet((p) => ({ ...p, address: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Tax Rate
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={outlet.taxRate}
                        onChange={(e) => setOutlet((p) => ({ ...p, taxRate: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingOutlet}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingOutlet && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Outlet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}