"use client";

import { useState, useEffect } from "react";
import {
  User,
  CheckCircle,
  Loader2,
  Save,
  AlertCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    adminName: "",
    adminEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [originalData, setOriginalData] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/superadmin");
        if (!res.ok) {
          throw new Error("Failed to load profile details");
        }
        const data = await res.json();
        if (data.superAdmin) {
          const profile = {
            name: data.superAdmin.name || "",
            email: data.superAdmin.email || "",
          };
          setOriginalData(profile);
          setForm((prev) => ({
            ...prev,
            adminName: profile.name,
            adminEmail: profile.email,
          }));
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setErrorMsg("Failed to load profile settings.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword) {
      if (form.newPassword.length < 8) {
        setToastMsg("New password must be at least 8 characters!");
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setToastMsg("Passwords do not match!");
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }
    }

    const payload: {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    } = {};

    let hasChanges = false;

    if (originalData) {
      if (form.adminName !== originalData.name) {
        payload.name = form.adminName;
        hasChanges = true;
      }
      if (form.adminEmail !== originalData.email) {
        payload.email = form.adminEmail;
        hasChanges = true;
      }
    }

    if (form.newPassword) {
      payload.newPassword = form.newPassword;
      hasChanges = true;
    }

    if (!hasChanges) {
      setToastMsg("No changes detected.");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }

    if (payload.email || payload.newPassword) {
      if (!form.currentPassword) {
        setToastMsg("Current password is required to change email or password!");
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }
      payload.currentPassword = form.currentPassword;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/superadmin/changeDetail", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorText = "Failed to update profile settings.";
        if (data.error) {
          if (typeof data.error === "object" && data.error.fieldErrors) {
            const errors = data.error.fieldErrors;
            errorText = Object.keys(errors)
              .map((k) => `${k}: ${errors[k].join(", ")}`)
              .join("; ");
          } else {
            errorText = String(data.error);
          }
        }
        throw new Error(errorText);
      }

      setToastMsg("Profile settings updated successfully!");
      setToastType("success");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);

      if (data.superAdmin) {
        const profile = {
          name: data.superAdmin.name || "",
          email: data.superAdmin.email || "",
        };
        setOriginalData(profile);
        setForm({
          adminName: profile.name,
          adminEmail: profile.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err: any) {
      console.error("Error updating profile settings:", err);
      setToastMsg(err.message || "Failed to update settings.");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-0">
        <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6 items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <span className="text-sm font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-0">
        <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          </div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm flex flex-col gap-4 items-center justify-center py-10 text-rose-700">
          <AlertCircle className="w-8 h-8 text-rose-500 mb-1" />
          <p className="text-sm font-semibold">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 mt-2 transition-all shadow cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-0">
      {/* Toast alert */}
      {showToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 text-white font-bold px-6 py-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            toastType === "success"
              ? "bg-[#0f6b4a] border border-emerald-700"
              : "bg-rose-900 border border-rose-700"
          }`}
        >
          {toastType === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-white" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-300" />
          )}
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Account & Profile</h2>

          </div>
        </div>

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
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Leave blank to keep unchanged"
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 pl-4 pr-11 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none bg-slate-50/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      className="w-full rounded-xl border border-slate-200/80 pl-4 pr-11 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none bg-slate-50/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNewPassword ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-type new password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="w-full rounded-xl border border-slate-200/80 pl-4 pr-11 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none bg-slate-50/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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

