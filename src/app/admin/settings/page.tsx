"use client";

import { useState } from "react";
import {
  User,
  CheckCircle,
  Loader2,
  Save,
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [form, setForm] = useState({
    adminName: "Super Administrator",
    adminEmail: "admin@abstraktpos.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setToastMsg("Passwords do not match!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setToastMsg("Profile settings updated successfully!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-0">
      {/* Toast alert */}
      {showToast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>

        </div>
      </div>

      {/* Settings Form Card */}
      <form onSubmit={handleSaveSettings} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Account & Profile</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Edit credentials used for logging into the platform control center</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                required
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none bg-slate-50/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                required
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none bg-slate-50/20"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-2">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Change Password</h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wide">Current Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none bg-slate-50/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none bg-slate-50/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Re-type new password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none bg-slate-50/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-slate-100 mt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 text-sm transition-all shadow-md active:scale-98 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Saving changes..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
