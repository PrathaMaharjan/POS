"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import {
  Building,
  Lock,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  User,
  Shield,
  RefreshCw,
} from "lucide-react";

export default function ProfileSettingsPage() {
  const { tenantSlug } = useParams();

  // Success/error toast indicators
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ==========================================
  // ORGANIZATION STATE
  // ==========================================
  const displayTenantName = typeof tenantSlug === "string"
    ? tenantSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : "Gourmet POS";

  const [orgName, setOrgName] = useState(displayTenantName);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoPublicId, setLogoPublicId] = useState<string>("");
  const [isOrgSaving, setIsOrgSaving] = useState(false);
  const [isOrgLoading, setIsOrgLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook for Cloudinary Image Upload
  const { uploadImage, uploading: logoUploading, error: uploadError } = useImageUpload();

  // ==========================================
  // ACCOUNT & SECURITY STATE
  // ==========================================
  const [accountForm, setAccountForm] = useState({
    name: "Alexander Wright",
    email: "admin@gourmetpos.com",
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSecuritySaving, setIsSecuritySaving] = useState(false);

  // ==========================================
  // GET API CALLS ON MOUNT
  // ==========================================
  const fetchProfileAndOrgData = async () => {
    setIsOrgLoading(true);
    try {
      // 1. Fetch organization tenant info
      const orgRes = await api.get("/org/tenant");
      const orgData = orgRes.data;

      setOrgName(orgData.name || displayTenantName);

      if (orgData.imageUrl) {
        setLogoUrl(orgData.imageUrl);
      }
      if (orgData.imagePublicId) {
        setLogoPublicId(orgData.imagePublicId);
      }

      // 2. Fetch logged-in user credentials from localStorage cache
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        setAccountForm({
          name: userData.name || "Alexander Wright",
          email: userData.email || "admin@gourmetpos.com",
        });
      }
    } catch (err: any) {
      console.error("Failed to load profile data:", err);
      showToast("Error loading profile configuration from backend.", "error");
    } finally {
      setIsOrgLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndOrgData();
  }, []);

  // ==========================================
  // LOGO UPLOAD & PROCESSING
  // ==========================================
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Only image assets are accepted.", "error");
      return;
    }

    // Upload image to Cloudinary using real hook
    const result = await uploadImage(file);
    if (result) {
      setLogoPublicId(result.publicId);
      const simulatedLocalUrl = URL.createObjectURL(file);
      setLogoUrl(simulatedLocalUrl);
      showToast("Logo asset uploaded successfully! Save changes to apply.");
    } else {
      showToast(uploadError || "Cloudinary image upload failed.", "error");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // ==========================================
  // SUBMIT HANDLERS
  // ==========================================
  const handleOrgSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOrgSaving(true);

    try {
      const payload: { name: string; imagePublicId?: string } = {
        name: orgName,
      };

      if (logoPublicId) {
        payload.imagePublicId = logoPublicId;
      }

      const res = await api.patch("/org/tenant", payload);

      setOrgName(res.data.name);

      if (res.data.imageUrl) {
        setLogoUrl(res.data.imageUrl);
      }

      showToast("Organization settings saved successfully!");
    } catch (err: any) {
      console.error("Failed to update organization:", err);
      const errMsg = err.response?.data?.error ?? err.message ?? "Failed to save organization settings.";
      showToast(errMsg, "error");
    } finally {
      setIsOrgSaving(false);
    }
  };

  const handleRevertOrg = () => {
    fetchProfileAndOrgData();
    showToast("Changes reverted.");
  };

  const handleSecuritySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (securityForm.newPassword || securityForm.confirmPassword) {
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        showToast("New passwords do not match.", "error");
        return;
      }
      if (securityForm.newPassword.length < 8) {
        showToast("New password must be at least 8 characters long.", "error");
        return;
      }
      if (!securityForm.currentPassword) {
        showToast("Current password is required to change password.", "error");
        return;
      }
    }

    setIsSecuritySaving(true);

    try {
      const payload: any = {
        name: accountForm.name,
        email: accountForm.email,
      };

      if (securityForm.currentPassword && securityForm.newPassword) {
        payload.currentPassword = securityForm.currentPassword;
        payload.newPassword = securityForm.newPassword;
      }

      const res = await api.patch("/auth/change-userDetail", payload);

      // Update local storage user credentials cache
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...userData,
            name: res.data.user.name,
            email: res.data.user.email,
          })
        );
      }

      setAccountForm({
        name: res.data.user.name,
        email: res.data.user.email,
      });

      setSecurityForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showToast("Account credentials updated successfully!");
    } catch (err: any) {
      console.error("Failed to update user security details:", err);
      const errMsg = err.response?.data?.error ?? err.message ?? "Failed to update credentials.";
      showToast(errMsg, "error");
    } finally {
      setIsSecuritySaving(false);
    }
  };

  const handleClearSecurity = () => {
    setSecurityForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    showToast("Form cleared.");
  };





  if (isOrgLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f6b4a]" />
        <span className="text-sm font-semibold tracking-wider">Loading settings configurations...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 select-none">


      <div className="rounded-xl bg-[#0f6b4a] px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Profile & Security</h1>

        </div>

      </div>


      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0f6b4a] text-white font-bold px-6 py-4 rounded-xl shadow-2xl border border-emerald-700 animate-in fade-in slide-in-from-bottom-4 duration-300`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-white" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-300" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">


        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col gap-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-m font-semibold text-slate-700">Organization Settings</h2>

            </div>

            <form onSubmit={handleOrgSubmit} className="space-y-6">

              <div className="flex flex-col items-center gap-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider self-start">Brand Logo</label>


                <div className="relative group w-32 h-32 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center overflow-hidden transition-all hover:border-emerald-500">
                  {logoUrl ? (

                    <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <span className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl mb-1 shadow-xs border border-emerald-100">
                        {getInitials(orgName)}
                      </span>
                    </div>
                  )}


                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoUploading}
                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 text-white transition-opacity duration-200 text-xs font-semibold disabled:cursor-not-allowed"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Change Logo</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />


                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-slate-200/85 hover:border-emerald-500 rounded-xl p-3 bg-slate-50/40 hover:bg-emerald-50/5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-slate-500"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-bold">Drag & Drop Image Here</span>

                </div>

                {logoUploading && (
                  <div className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 mt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f6b4a]" />
                    <span>Uploading to Cloudinary...</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">Restaurant / Organization Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    disabled={isOrgSaving}
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Enter organization name"
                    className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>


              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">

                <button
                  type="submit"
                  disabled={isOrgSaving}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed h-[38px] shadow-sm"
                >
                  {isOrgSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Save Organization</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>


        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col gap-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-m font-semibold text-slate-700">Account Owner & Password</h2>

            </div>

            <form onSubmit={handleSecuritySubmit} className="space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500">Owner Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      disabled={isSecuritySaving}
                      type="text"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      placeholder="Enter owner name"
                      className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>


                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      disabled={isSecuritySaving}
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                      placeholder="Enter owner email"
                      className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>


              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">Current Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    disabled={isSecuritySaving}
                    type={showCurrentPassword ? "text" : "password"}
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                    placeholder="Enter current password to make changes"
                    className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrentPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">New Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    disabled={isSecuritySaving}
                    type={showNewPassword ? "text" : "password"}
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    placeholder="Enter new password (optional)"
                    className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>



              </div>


              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">Confirm New Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    disabled={isSecuritySaving}
                    type={showConfirmPassword ? "text" : "password"}
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>


                {securityForm.confirmPassword && securityForm.newPassword !== securityForm.confirmPassword && (
                  <span className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match yet.
                  </span>
                )}
                {securityForm.confirmPassword && securityForm.newPassword === securityForm.confirmPassword && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2">
                    <CheckCircle className="w-3.5 h-3.5" /> Passwords match perfectly.
                  </span>
                )}
              </div>




              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClearSecurity}
                  disabled={isSecuritySaving}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 h-[38px]"
                >
                  <span>Clear Fields</span>
                </button>
                <button
                  type="submit"
                  disabled={
                    isSecuritySaving ||
                    !accountForm.name ||
                    !accountForm.email
                  }
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed h-[38px] shadow-sm"
                >
                  {isSecuritySaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Update Account</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
