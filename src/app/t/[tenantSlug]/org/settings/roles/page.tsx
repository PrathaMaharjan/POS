"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Shield, CheckCircle2, Loader2, Info, Store, ChevronDown } from "lucide-react";
import api from "@/lib/api";

interface Permission {
  code: string;
  name: string;
  desc: string;
  allowedRoles: string[];
}

const MODULES: Permission[] = [
  { code: "overview", name: "Overview", desc: "View sales overview and dashboard stats", allowedRoles: ["MANAGER", "CASHIER"] },
  { code: "staff", name: "Manage Staff", desc: "Add, edit, and manage staff members", allowedRoles: ["MANAGER"] },
  { code: "outlets", name: "Outlets", desc: "Manage physical outlets and locations", allowedRoles: ["MANAGER"] },
  { code: "tables", name: "Tables", desc: "View and manage table layout configuration", allowedRoles: ["MANAGER", "CASHIER", "WAITER"] },
  { code: "order_history", name: "Order History", desc: "View and track order history logs", allowedRoles: ["MANAGER", "CASHIER", "WAITER"] },
  { code: "menu", name: "Menu", desc: "View, update, and edit menu items", allowedRoles: ["MANAGER"] },
  { code: "payments", name: "Payments", desc: "Process bills and view transaction logs", allowedRoles: ["MANAGER", "CASHIER"] },
  { code: "reports", name: "Reports", desc: "Access comprehensive sales reports and analytics", allowedRoles: ["MANAGER"] },
  { code: "kitchen", name: "Kitchen Display", desc: "View and prepare orders in the kitchen dashboard", allowedRoles: ["KITCHEN"] },
  { code: "takeaway", name: "Takeaway", desc: "Manage takeaway orders and customer pickups", allowedRoles: ["MANAGER", "CASHIER"] },
];

const ROLES = [
  { code: "MANAGER", name: "MANAGER", textColor: "text-emerald-700", dotColor: "bg-emerald-600" },
  { code: "CASHIER", name: "CASHIER", textColor: "text-emerald-600", dotColor: "bg-emerald-500" },
  { code: "KITCHEN", name: "KITCHEN", textColor: "text-slate-600", dotColor: "bg-slate-500" },
  { code: "WAITER", name: "WAITER", textColor: "text-slate-500", dotColor: "bg-slate-400" },
];

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  MANAGER: {
    overview: true,
    staff: true,
    outlets: true,
    tables: true,
    order_history: true,
    menu: true,
    payments: true,
    reports: true,
    takeaway: true,
  },
  CASHIER: {
    overview: true,
    tables: true,
    order_history: true,
    payments: true,
    takeaway: true,
  },
  KITCHEN: {
    kitchen: true,
  },
  WAITER: {
    tables: true,
    order_history: true,
  }
};

export default function RolesConfigPage() {
  const { tenantSlug } = useParams();
  const [outlets, setOutlets] = useState<any[]>([]);
  const [activeOutletId, setActiveOutletId] = useState<string>("");
  const [permissionsState, setPermissionsState] = useState<Record<string, Record<string, Record<string, boolean>>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);

  const activeOutlet = useMemo(() => outlets.find((o) => o.id === activeOutletId), [outlets, activeOutletId]);

  useEffect(() => {
    async function loadOutlets() {
      try {
        setIsLoading(true);
        const res = await api.get("/outlets");
        const list = res.data.outlets ?? [];
        setOutlets(list);
        if (list.length > 0) {
          const stored = localStorage.getItem("activeOutletId");
          if (stored && list.some((o: any) => o.id === stored)) {
            setActiveOutletId(stored);
          } else {
            setActiveOutletId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load outlets from API, using mockups", err);
        const mockOutlets = [
          { id: "1", name: "lalala" },
          { id: "2", name: "Delights" }
        ];
        setOutlets(mockOutlets);
        const stored = localStorage.getItem("activeOutletId");
        if (stored && mockOutlets.some((o: any) => o.id === stored)) {
          setActiveOutletId(stored);
        } else {
          setActiveOutletId("1");
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadOutlets();
  }, []);

  useEffect(() => {
    if (!outletDropdownOpen) return;
    const handler = () => setOutletDropdownOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [outletDropdownOpen]);

  const handleOutletChange = (id: string) => {
    localStorage.setItem("activeOutletId", id);
    setActiveOutletId(id);
    setOutletDropdownOpen(false);
  };

  const currentPermissions = useMemo(() => {
    if (!activeOutletId) return DEFAULT_PERMISSIONS;
    if (!permissionsState[activeOutletId]) {
      return DEFAULT_PERMISSIONS;
    }
    return permissionsState[activeOutletId];
  }, [activeOutletId, permissionsState]);

  const handleToggle = (roleCode: string, permissionCode: string) => {
    if (!activeOutletId) return;
    setPermissionsState((prev) => {
      const outletState = prev[activeOutletId]
        ? { ...prev[activeOutletId] }
        : JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));

      const roleState = { ...outletState[roleCode] };
      roleState[permissionCode] = !roleState[permissionCode];
      outletState[roleCode] = roleState;

      return {
        ...prev,
        [activeOutletId]: outletState,
      };
    });
  };

  const getRolePermissionCount = (roleCode: string) => {
    const allowedForRole = MODULES.filter((m) => m.allowedRoles.includes(roleCode));
    const totalAllowed = allowedForRole.length;
    const outletState = permissionsState[activeOutletId] || DEFAULT_PERMISSIONS;
    const enabledCount = allowedForRole.filter((m) => outletState[roleCode]?.[m.code] ?? false).length;
    return `${enabledCount}/${totalAllowed}`;
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-8 select-none">

      {/* Header Banner */}
      <div className="rounded-xl bg-[#0f6b4a] px-6 py-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">

            <h1 className="text-2xl font-semibold tracking-tight text-white">Role Permissions</h1>
          </div>

        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Outlet picker */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOutletDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border bg-white text-emerald-700 border-white shadow-sm transition-colors hover:bg-emerald-50"
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
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Select Outlet
                  </p>
                </div>
                <div className="py-1">
                  {outlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      onClick={() => handleOutletChange(outlet.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${activeOutletId === outlet.id
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${activeOutletId === outlet.id ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                      />
                      {outlet.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center justify-center gap-2 rounded-lg border bg-white text-emerald-700 border-white shadow-sm hover:bg-emerald-50 px-5 py-2 text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4.5 w-4.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0f6b4a]" />
          <span className="text-sm font-semibold tracking-wider">Loading settings configurations...</span>
        </div>
      ) : (
        <>

          {/* Configuration Matrix Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6 w-[40%]">Module</th>
                    {ROLES.map((role) => (
                      <th key={role.code} className="py-4 px-6 text-center border-l border-slate-100/50">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${role.dotColor}`} />
                            <span className={`font-bold ${role.textColor}`}>{role.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-medium lowercase">
                            {getRolePermissionCount(role.code)} active
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MODULES.map((m) => (
                    <tr key={m.code} className="hover:bg-slate-50/40 transition-colors group">
                      {/* Module Description */}
                      <td className="py-4.5 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                            {m.name}
                          </span>
                          <span className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {m.desc}
                          </span>
                        </div>
                      </td>

                      {/* Toggles per Role */}
                      {ROLES.map((role) => {
                        const isAllowed = m.allowedRoles.includes(role.code);
                        const isEnabled = currentPermissions[role.code]?.[m.code] ?? false;

                        return (
                          <td key={role.code} className="py-4.5 px-6 text-center border-l border-slate-100/50">
                            {isAllowed ? (
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggle(role.code, m.code)}
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? "bg-emerald-600" : "bg-slate-200"
                                    }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isEnabled ? "translate-x-5" : "translate-x-0"
                                      }`}
                                  />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-xs font-bold text-slate-300 opacity-60 select-none">
                                  N/A
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>



        </>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0f6b4a] text-white font-bold px-6 py-4 rounded-xl shadow-2xl border border-emerald-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Role configuration updated successfully!</span>
        </div>
      )}
    </div>
  );
}
