"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Store,
  MapPin,
  Percent,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Building2,
  ChevronDown,
  QrCode,
  Download,
  Printer,
  Phone,
} from "lucide-react";
import api from "@/lib/api";

type Section = "account" | "outlet" | "qrMenu" | null;

export default function SettingsPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [openSection, setOpenSection] = useState<Section>("account");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && tenantSlug) {
      const origin = window.location.origin;
      const targetUrl = `${origin}/menu/${tenantSlug}`;
      setQrUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`,
      );
    }
  }, [tenantSlug]);

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${tenantSlug}-menu-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download QR code", err);
      window.open(qrUrl, "_blank");
    }
  };

  const [account, setAccount] = useState({
    name: "",
    email: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [outlet, setOutlet] = useState({
    id: "",
    name: "",
    address: "",
    phone: "",
    taxRate: 8,
  });

  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingOutlet, setIsSavingOutlet] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Populate user account info
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setAccount({
          name: userData.name || "",
          email: userData.email || "",
        });
      } catch (err) {
        console.error("Error parsing user from localStorage", err);
      }
    }

    // Fetch outlets
    async function loadOutletDetails() {
      try {
        const storedOutletId = localStorage.getItem("activeOutletId");
        if (!storedOutletId) return;

        const res = await api.get("/outlets");
        const list = res.data.outlets ?? [];
        const currentOutlet = list.find((o: any) => o.id === storedOutletId);
        if (currentOutlet) {
          setOutlet({
            id: currentOutlet.id,
            name: currentOutlet.name || "",
            address: currentOutlet.address || "",
            phone: currentOutlet.phone || "",
            taxRate: currentOutlet.taxRate ?? 8,
          });
        }
      } catch (err) {
        console.error("Error loading outlet details", err);
      }
    }

    loadOutletDetails();
  }, []);

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
    setError(null);
    setSavedMsg(null);

    try {
      const payload: any = {
        name: account.name,
        email: account.email,
      };

      if (passwords.current && passwords.next) {
        payload.currentPassword = passwords.current;
        payload.newPassword = passwords.next;
      }

      const res = await api.patch("/auth/change-userDetail", payload);

      // Save user details to localStorage
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...userData,
            name: res.data.user.name,
            email: res.data.user.email,
          }),
        );
      }

      setPasswords({ current: "", next: "", confirm: "" });
      flashSaved("Account settings updated successfully.");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ?? "Failed to update account settings.",
      );
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function handleSaveOutlet(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingOutlet(true);
    setError(null);
    setSavedMsg(null);

    try {
      if (!outlet.id) {
        throw new Error("No active outlet selected.");
      }

      const payload = {
        name: outlet.name,
        address: outlet.address,
        phone: outlet.phone,
        taxRate: outlet.taxRate,
      };

      await api.patch(`/outlets/${outlet.id}`, payload);
      flashSaved("Outlet settings updated successfully.");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ?? "Failed to update outlet settings.",
      );
    } finally {
      setIsSavingOutlet(false);
    }
  }

  const passwordMismatch =
    passwords.next.length > 0 &&
    passwords.confirm.length > 0 &&
    passwords.next !== passwords.confirm;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {savedMsg}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
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
                <h2 className="text-sm font-semibold text-slate-800">
                  Account
                </h2>
                <p className="text-xs text-slate-400">
                  Name, email, and password
                </p>
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
              <form
                onSubmit={handleSaveAccount}
                className="border-t border-slate-100"
              >
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
                        onChange={(e) =>
                          setAccount((p) => ({ ...p, name: e.target.value }))
                        }
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
                        onChange={(e) =>
                          setAccount((p) => ({ ...p, email: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Change Password
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {[
                        {
                          key: "current" as const,
                          placeholder: "Current password",
                        },
                        { key: "next" as const, placeholder: "New password" },
                        {
                          key: "confirm" as const,
                          placeholder: "Confirm new password",
                        },
                      ].map(({ key, placeholder }) => (
                        <div key={key} className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPw[key] ? "text" : "password"}
                            value={passwords[key]}
                            onChange={(e) =>
                              setPasswords((p) => ({
                                ...p,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder={placeholder}
                            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPw((p) => ({ ...p, [key]: !p[key] }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPw[key] ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                    {passwordMismatch && (
                      <p className="text-xs text-red-500 mt-2">
                        New passwords don't match.
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingAccount || passwordMismatch}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingAccount && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Save Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

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
                <p className="text-xs text-slate-400">
                  Business name, address, and tax rate
                </p>
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
              <form
                onSubmit={handleSaveOutlet}
                className="border-t border-slate-100"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Outlet Name
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={outlet.name}
                        onChange={(e) =>
                          setOutlet((p) => ({ ...p, name: e.target.value }))
                        }
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
                        onChange={(e) =>
                          setOutlet((p) => ({ ...p, address: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={outlet.phone}
                        onChange={(e) =>
                          setOutlet((p) => ({ ...p, phone: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Tax Rate (%)
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={outlet.taxRate}
                        onChange={(e) =>
                          setOutlet((p) => ({
                            ...p,
                            taxRate: Number(e.target.value),
                          }))
                        }
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
                    {isSavingOutlet && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Save Outlet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>


        {/* <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("qrMenu")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <QrCode className="h-4 w-4" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-semibold text-slate-800">
                  QR Code Menu
                </h2>
                <p className="text-xs text-slate-400">
                  Generate and download customer menu QR codes
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                openSection === "qrMenu" ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`grid transition-all duration-200 ease-in-out ${
              openSection === "qrMenu" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="border-t border-slate-100 p-8 flex flex-col items-center justify-center text-center gap-6 max-w-xl mx-auto">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-slate-800">
                    Menu QR Code
                  </h3>
                </div>

                <div className="flex flex-col items-center justify-center p-6 border border-slate-150 rounded-2xl bg-slate-50/50 shadow-inner w-64">
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm relative group overflow-hidden">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt="Menu QR Code"
                        width={180}
                        height={180}
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-[180px] h-[180px] flex items-center justify-center bg-slate-100 rounded-lg text-xs text-slate-400">
                        Generating QR...
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                    Scan preview
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!qrUrl}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Download QR PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={!qrUrl}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Printer className="h-4 w-4" />
                    Print QR Flyer
                  </button>
                </div>

                <div id="print-flyer-area" className="hidden flex-col items-center justify-center p-8 bg-white border-[12px] border-emerald-600 rounded-3xl max-w-sm mx-auto text-center font-sans">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <Store className="w-6 h-6 shrink-0" />
                      <span className="text-xl font-extrabold tracking-tight uppercase">
                        {outlet.name}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px] tracking-widest font-bold uppercase">
                      Welcome & Enjoy
                    </p>
                  </div>

                  <div className="my-6 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt="Menu QR Code"
                        width={200}
                        height={200}
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-[200px] h-[200px] bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-800">
                        Scan to Browse Menu
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No App or Login required
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-left mx-auto w-full max-w-[280px]">
                      <div className="flex items-start gap-2 text-[11px] text-slate-600 leading-normal">
                        <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-700 shrink-0">
                          1
                        </span>
                        <span>Open your smartphone camera app</span>
                      </div>
                      <div className="flex items-start gap-2 text-[11px] text-slate-600 leading-normal">
                        <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-700 shrink-0">
                          2
                        </span>
                        <span>Point camera at the QR code above</span>
                      </div>
                      <div className="flex items-start gap-2 text-[11px] text-slate-600 leading-normal">
                        <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-700 shrink-0">
                          3
                        </span>
                        <span>Tap the link to view our menu</span>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-400 pt-2 border-t border-slate-100">
                      Powered by Antigravity POS
                    </div>
                  </div>
                </div>

                <style>{`
                  @media print {
                    body * {
                      visibility: hidden !important;
                    }
                    #print-flyer-area, #print-flyer-area * {
                      visibility: visible !important;
                    }
                    #print-flyer-area {
                      position: absolute !important;
                      left: 50% !important;
                      top: 45% !important;
                      transform: translate(-50%, -50%) !important;
                      width: 320px !important;
                      height: 520px !important;
                      display: flex !important;
                      flex-direction: column !important;
                      align-items: center !important;
                      justify-content: center !important;
                      background: white !important;
                      border: 12px solid #059669 !important;
                      border-radius: 1.5rem !important;
                      padding: 2rem !important;
                      box-sizing: border-box !important;
                    }
                  }
                `}</style>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
