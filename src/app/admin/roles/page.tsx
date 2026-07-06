"use client";

import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import {
  Shield,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Building2,
  Users,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Store,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Role {
  id:          string;
  name:        string;
  orgId:       string;
  orgName:     string;
  isActive:    boolean;
  description: string;
}

interface Organization {
  id:       string;
  name:     string;
  isActive: boolean;
}

interface Outlet {
  id:                  string;
  name:                string;
  skipKitchenWorkflow: boolean;
}

interface Permission {
  id:           string;
  code:         string;
  module:       string;
  resource:     string;
  action:       string;
  isEnabled:    boolean;
  isOverridden: boolean;
  isProtected:  boolean;
  level:        "global" | "organization" | "outlet";
}

type PermissionsByModule = Record<string, Permission[]>;

const MODULE_GROUPS = {
  pos: {
    name: "POS Operations",
    resources: [
      { code: "billing",  name: "Billing"  },
      { code: "payments", name: "Payments" },
    ],
  },
  restaurant: {
    name: "Restaurant / Dining",
    resources: [
      { code: "tables", name: "Tables"                      },
      { code: "kot",    name: "KOT (Kitchen Order Tickets)" },
    ],
  },
  inventory: {
    name: "Inventory Management",
    resources: [
      { code: "categories", name: "Categories"     },
      { code: "products",   name: "Products"       },
      { code: "stock",      name: "Stock Tracking" },
      { code: "recipes",    name: "Recipes"        },
    ],
  },
  core: {
    name: "Core Administration",
    resources: [
      { code: "outlets", name: "Outlets" },
      { code: "users",   name: "Users"   },
      { code: "roles",   name: "Roles"   },
    ],
  },
};

const ACTIONS = ["create", "read", "update", "delete"] as const;
const ITEMS_PER_PAGE = 8;

// ── axios instance with superAdminToken ──
const api = axios.create({ baseURL: "/" });
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("superAdminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function SuperAdminRolesPage() {
  // org
  const [organizations,    setOrganizations]    = useState<Organization[]>([]);
  const [activeOrgId,      setActiveOrgId]      = useState<string>("");
  const [orgDropdownOpen,  setOrgDropdownOpen]  = useState(false);

  // outlet
  const [outlets,            setOutlets]            = useState<Outlet[]>([]);
  const [activeOutletId,     setActiveOutletId]     = useState<string>("");
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
  const [isOutletsLoading,   setIsOutletsLoading]   = useState(false);
  const [skipLoading,        setSkipLoading]        = useState(false);

  // roles
  const [roles,     setRoles]     = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // permissions
  const [expandedRole,         setExpandedRole]         = useState<string | null>(null);
  const [rolePermissions,      setRolePermissions]      = useState<Record<string, PermissionsByModule>>({});
  const [isPermissionsLoading, setIsPermissionsLoading] = useState<Record<string, boolean>>({});
  const [permissionsError,     setPermissionsError]     = useState<Record<string, string | null>>({});
  const [togglingPermId,       setTogglingPermId]       = useState<string | null>(null);

  // ui
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "active" | "inactive">("ALL");
  const [currentPage,  setCurrentPage]  = useState(1);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── authoritative single-field fetch — reads the SAME endpoint you tested
  //    (/api/superadmin/organizations/{orgId}/outlet/{outletId}) and corrects
  //    whatever the bulk outlets list got wrong ──
  const fetchSkipKitchenStatus = async (outletId: string) => {
    if (!activeOrgId || !outletId) return;
    try {
      const { data } = await api.get(
        `/api/superadmin/organizations/${activeOrgId}/outlet/${outletId}`
      );

      // defensive: handle either a flat or nested response shape
      // remove the fallback chain once you confirm the exact shape in console
      const skipValue =
        data.skipKitchenWorkflow ??
        data.outlet?.skipKitchenWorkflow ??
        false;

      console.log("RAW single-outlet response:", data); // ← remove once confirmed

      setOutlets((prev) =>
        prev.map((o) =>
          o.id === outletId ? { ...o, skipKitchenWorkflow: skipValue } : o
        )
      );
    } catch (err) {
      console.error("Failed to fetch skip-kitchen status", err);
    }
  };

  // ── 1. load orgs ──
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const { data } = await api.get("/api/superadmin/organization");
        const list: Organization[] = (data.organizations ?? []).map((o: any) => ({
          id: o.id, name: o.name, isActive: o.isActive ?? true,
        }));
        setOrganizations(list);
        if (list.length > 0) setActiveOrgId(list[0].id);
      } catch (err: any) {
        showToast(err.response?.data?.error ?? "Failed to load organizations", "error");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // ── 2. load outlets when org changes ──
  useEffect(() => {
    if (!activeOrgId) return;
    async function load() {
      setIsOutletsLoading(true);
      setOutlets([]);
      setActiveOutletId("");
      setExpandedRole(null);
      setRolePermissions({});
      try {
        const { data } = await api.get(`/api/superadmin/organization/${activeOrgId}`);
        const list: Outlet[] = (data.outlets ?? []).map((o: any) => ({
          id: o.id, name: o.name, skipKitchenWorkflow: o.skipKitchenWorkflow ?? false,
        }));
        setOutlets(list);
        if (list.length > 0) {
          setActiveOutletId(list[0].id);
          fetchSkipKitchenStatus(list[0].id); // ← NEW: correct the value from the reliable single-outlet route
        }
      } catch (err: any) {
        showToast(err.response?.data?.error ?? "Failed to load outlets", "error");
      } finally {
        setIsOutletsLoading(false);
      }
    }
    load();
  }, [activeOrgId]);

  // ── 3. load roles when org changes ──
  useEffect(() => {
    if (!activeOrgId) return;
    async function load() {
      setIsLoading(true);
      setRoles([]);
      setExpandedRole(null);
      setRolePermissions({});
      try {
        const { data } = await api.get(`/api/superadmin/organizations/${activeOrgId}/role`);
        const orgName = organizations.find((o) => o.id === activeOrgId)?.name ?? "";
        const list: Role[] = (data.roles ?? []).map((r: any) => ({
          id: r.id, name: r.name, orgId: activeOrgId, orgName,
          isActive: r.isActive ?? true, description: r.description ?? "",
        }));
        setRoles(list);
      } catch (err: any) {
        showToast(err.response?.data?.error ?? "Failed to load roles", "error");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [activeOrgId, organizations]);

  // ── 4. fetch permissions for a role ──
  const fetchPermissions = async (roleId: string) => {
    setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: true }));
    setPermissionsError((prev)     => ({ ...prev, [roleId]: null }));
    try {
      const params: Record<string, string> = { roleId };
      if (activeOutletId) params.outletId = activeOutletId;
      const { data } = await api.get(
        `/api/superadmin/organizations/${activeOrgId}/role-permissions`,
        { params }
      );
      setRolePermissions((prev) => ({ ...prev, [roleId]: data.permissions ?? {} }));
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? "Failed to load permissions";
      setPermissionsError((prev) => ({ ...prev, [roleId]: msg }));
    } finally {
      setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: false }));
    }
  };

  // ── 5. toggle a single permission ──
  const handleTogglePermission = async (
    roleId: string, permId: string, isEnabled: boolean, isProtected: boolean
  ) => {
    if (isProtected) { showToast("This permission is protected and cannot be modified", "error"); return; }
    const nextState = !isEnabled;
    // optimistic
    setRolePermissions((prev) => {
      const copy: PermissionsByModule = {};
      Object.entries(prev[roleId] ?? {}).forEach(([mod, list]) => {
        copy[mod] = list.map((p) =>
          p.id === permId
            ? { ...p, isEnabled: nextState, isOverridden: true, level: activeOutletId ? "outlet" : "organization" }
            : p
        );
      });
      return { ...prev, [roleId]: copy };
    });
    setTogglingPermId(permId);
    try {
      const body: Record<string, any> = { roleId, permissionId: permId, isEnabled: nextState };
      if (activeOutletId) body.outletId = activeOutletId;
      await api.patch(`/api/superadmin/organizations/${activeOrgId}/role-permissions`, body);
      showToast("Permission updated successfully");
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to update permission", "error");
      // revert
      setRolePermissions((prev) => {
        const copy: PermissionsByModule = {};
        Object.entries(prev[roleId] ?? {}).forEach(([mod, list]) => {
          copy[mod] = list.map((p) => p.id === permId ? { ...p, isEnabled } : p);
        });
        return { ...prev, [roleId]: copy };
      });
    } finally {
      setTogglingPermId(null);
    }
  };

  // ── 6. reset permissions ──
  const handleResetPermissions = async (roleId: string) => {
    setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: true }));
    try {
      const body: Record<string, any> = { roleId };
      if (activeOutletId) body.outletId = activeOutletId;
      await api.post(`/api/superadmin/organizations/${activeOrgId}/role-permissions/reset`, body);
      showToast("Permissions reverted to global defaults");
      await fetchPermissions(roleId);
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to reset permissions", "error");
    } finally {
      setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: false }));
    }
  };

  // ── 7. skip kitchen workflow toggle ──
  const handleToggleSkipKitchen = async () => {
    if (!activeOutletId) return;
    const outlet = outlets.find((o) => o.id === activeOutletId);
    if (!outlet) return;
    const next = !outlet.skipKitchenWorkflow;
    // optimistic
    setOutlets((prev) =>
      prev.map((o) => o.id === activeOutletId ? { ...o, skipKitchenWorkflow: next } : o)
    );
    setSkipLoading(true);
    try {
      await api.patch(
        `/api/superadmin/organizations/${activeOrgId}/outlet/${activeOutletId}`,
        { skipKitchenWorkflow: next }
      );
      await fetchSkipKitchenStatus(activeOutletId); // ← NEW: re-verify from DB instead of trusting optimistic value
      showToast(next ? "Kitchen workflow bypassed for this outlet" : "Kitchen workflow restored");
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to update", "error");
      // revert
      setOutlets((prev) =>
        prev.map((o) => o.id === activeOutletId ? { ...o, skipKitchenWorkflow: !next } : o)
      );
    } finally {
      setSkipLoading(false);
    }
  };

  // ── expand row ──
  const handleToggleExpand = async (roleId: string) => {
    if (expandedRole === roleId) { setExpandedRole(null); return; }
    setExpandedRole(roleId);
    if (!rolePermissions[roleId]) await fetchPermissions(roleId);
  };

  const getPermissionItem = (roleId: string, module: string, resource: string, action: string) => {
    return (rolePermissions[roleId]?.[module] ?? []).find(
      (p) => p.resource === resource && p.action === action
    );
  };

  const getActivePermissionsCount = (roleId: string) =>
    Object.values(rolePermissions[roleId] ?? {}).flat().filter((p) => p.isEnabled).length;

  const getTotalPermissionsCount = (roleId: string) =>
    Object.values(rolePermissions[roleId] ?? {}).flat().length;

  // ── derived ──
  const activeOrgName    = organizations.find((o) => o.id === activeOrgId)?.name ?? "Select Organization";
  const activeOutletName = outlets.find((o) => o.id === activeOutletId)?.name   ?? "Select Outlet";
  const activeOutlet     = outlets.find((o) => o.id === activeOutletId);

  const handleOrgChange = (id: string) => {
    setActiveOrgId(id); setCurrentPage(1); setExpandedRole(null); setOrgDropdownOpen(false);
  };
  const handleOutletChange = (id: string) => {
    setActiveOutletId(id); setCurrentPage(1); setExpandedRole(null);
    setRolePermissions({}); setOutletDropdownOpen(false);
    fetchSkipKitchenStatus(id); // ← NEW: correct the value the moment the outlet changes
  };

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const q = search.toLowerCase();
      const matchesSearch = role.name.toLowerCase().includes(q) || role.description.toLowerCase().includes(q);
      let matchesStatus = true;
      if (statusFilter === "active")   matchesStatus = role.isActive;
      if (statusFilter === "inactive") matchesStatus = !role.isActive;
      return matchesSearch && matchesStatus;
    });
  }, [roles, search, statusFilter]);

  const stats = useMemo(() => {
    const hasFilters = search.trim() !== "" || statusFilter !== "ALL";
    const src = hasFilters ? filteredRoles : roles;
    return {
      total:    src.length,
      active:   src.filter((r) => r.isActive).length,
      inactive: src.filter((r) => !r.isActive).length,
      outlets:  outlets.length,
      skipKot:  outlets.filter((o) => o.skipKitchenWorkflow).length,
      hasFilters,
    };
  }, [roles, filteredRoles, outlets, search, statusFilter]);

  const totalPages     = Math.ceil(filteredRoles.length / ITEMS_PER_PAGE);
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRoles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRoles, currentPage]);

  useEffect(() => {
    if (!orgDropdownOpen) return;
    const close = () => setOrgDropdownOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [orgDropdownOpen]);

  useEffect(() => {
    if (!outletDropdownOpen) return;
    const close = () => setOutletDropdownOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [outletDropdownOpen]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-0 select-none">

      {/* ── HEADER — overflow-visible so dropdowns are never clipped ── */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-visible">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Superadmin Roles</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

          {/* org picker */}
          <div className="relative z-[100]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setOrgDropdownOpen((prev) => !prev); setOutletDropdownOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border bg-white text-emerald-700 border-white shadow-sm transition-colors hover:bg-emerald-50"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="max-w-[120px] truncate">{activeOrgName}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${orgDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {orgDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-[200] overflow-hidden text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Organization</p>
                </div>
                <div className="py-1 max-h-60 overflow-y-auto">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgChange(org.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                        activeOrgId === org.id ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${activeOrgId === org.id ? "bg-emerald-500" : "bg-slate-200"}`} />
                      <span className="flex-1 truncate">{org.name}</span>
                      {!org.isActive && <span className="text-[9px] text-rose-500 font-bold">SUSPENDED</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* outlet picker */}
          <div className="relative z-[100]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setOutletDropdownOpen((prev) => !prev); setOrgDropdownOpen(false); }}
              disabled={isOutletsLoading || outlets.length === 0}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border bg-white text-emerald-700 border-white shadow-sm transition-colors hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                {isOutletsLoading
                  ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                  : <Store className="w-4 h-4 shrink-0" />
                }
                <span className="max-w-[120px] truncate">{activeOutletName}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${outletDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {outletDropdownOpen && outlets.length > 0 && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-[200] overflow-hidden text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Outlet Scope</p>
                </div>
                <div className="py-1 max-h-60 overflow-y-auto">
                  {outlets.map((ot) => (
                    <button
                      key={ot.id}
                      onClick={() => handleOutletChange(ot.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                        activeOutletId === ot.id ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${activeOutletId === ot.id ? "bg-emerald-500" : "bg-slate-200"}`} />
                      <span className="flex-1 truncate">{ot.name}</span>
                      {ot.skipKitchenWorkflow && (
                        <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1 rounded border border-amber-200">NO KOT</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SKIP KITCHEN BANNER ── */}
      {activeOutlet && (
        <div className={`flex items-center justify-between rounded-xl px-5 py-3.5 border ${
          activeOutlet.skipKitchenWorkflow ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${activeOutlet.skipKitchenWorkflow ? "bg-amber-100" : "bg-slate-100"}`}>
              {activeOutlet.skipKitchenWorkflow
                ? <ToggleRight className="w-5 h-5 text-amber-600" />
                : <ToggleLeft  className="w-5 h-5 text-slate-400" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Skip Kitchen Workflow
                <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  activeOutlet.skipKitchenWorkflow
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                  {activeOutlet.skipKitchenWorkflow ? "ENABLED" : "DISABLED"}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeOutlet.skipKitchenWorkflow
                  ? `Orders go directly to ready — KOT tickets bypassed for "${activeOutlet.name}"`
                  : `Orders flow through kitchen display normally for "${activeOutlet.name}"`
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleSkipKitchen}
            disabled={skipLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 ${
              activeOutlet.skipKitchenWorkflow
                ? "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            {skipLoading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
              : activeOutlet.skipKitchenWorkflow ? "Disable" : "Enable"
            }
          </button>
        </div>
      )}

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: stats.hasFilters ? "Filtered Roles"     : "Total Roles",       value: stats.total,    border: "border-l-slate-400",   iconBg: "bg-slate-50 text-slate-600",   icon: <Shield     className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: stats.hasFilters ? "Filtered Active"    : "Active Roles",      value: stats.active,   border: "border-l-emerald-500", iconBg: "bg-emerald-50 text-emerald-600",icon: <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: stats.hasFilters ? "Filtered Suspended" : "Suspended",         value: stats.inactive, border: "border-l-rose-500",    iconBg: "bg-rose-50 text-rose-600",     icon: <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Total Outlets",                                                value: stats.outlets,  border: "border-l-blue-500",    iconBg: "bg-blue-50 text-blue-600",     icon: <Settings2  className="h-5 w-5 sm:h-6 sm:w-6" /> },
          { label: "Skip Kitchen",                                                 value: stats.skipKot,  border: "border-l-amber-500",   iconBg: "bg-amber-50 text-amber-600",   icon: <Users      className="h-5 w-5 sm:h-6 sm:w-6" /> },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border-l-4 ${s.border} border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between`}>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{s.value}</p>
            </div>
            <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search role name, description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span className="text-sm font-medium">Loading roles configuration...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto whitespace-nowrap lg:whitespace-normal">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Role Name</th>
                  <th className="py-3.5 px-6">Organization</th>
                  <th className="py-3.5 px-6">Permissions</th>
                  <th className="py-3.5 px-6 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRoles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-sm text-slate-400">
                      No roles match your search or filter configuration.
                    </td>
                  </tr>
                ) : paginatedRoles.map((role) => {
                  const isExpanded   = expandedRole === role.id;
                  const permsLoading = isPermissionsLoading[role.id] ?? false;
                  const permsErr     = permissionsError[role.id]     ?? null;
                  const activeCount  = getActivePermissionsCount(role.id);
                  const totalCount   = getTotalPermissionsCount(role.id);

                  return (
                    <React.Fragment key={role.id}>
                      {/* ── ROW ── */}
                      <tr onClick={() => handleToggleExpand(role.id)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                        <td className="py-4 px-6 font-semibold text-slate-800">{role.name}</td>
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{role.orgName || activeOrgName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {rolePermissions[role.id] ? (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {activeCount} / {totalCount} enabled
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Click to load</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleExpand(role.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              isExpanded
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {permsLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                            <Shield className="w-3 h-3" />
                            {isExpanded ? "Close" : "Manage"}
                          </button>
                        </td>
                      </tr>

                      {/* ── EXPANDED PERMISSIONS ── */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={4} className="px-6 py-5">
                            <div className="animate-in fade-in duration-200">
                              <div className="w-full min-w-0">

                                {/* legend + reset */}
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Shield className="w-4 h-4 text-emerald-600" />
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                      Permission Privilege Catalog
                                    </h3>
                                    <div className="flex items-center gap-1.5 ml-1">
                                      {(["global", "organization", "outlet"] as const).map((lvl) => (
                                        <span key={lvl} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                          lvl === "outlet"       ? "bg-amber-50 text-amber-700 border-amber-200"  :
                                          lvl === "organization" ? "bg-blue-50 text-blue-700 border-blue-200"     :
                                          "bg-slate-100 text-slate-400 border-transparent"
                                        }`}>{lvl}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleResetPermissions(role.id)}
                                    disabled={permsLoading}
                                    className="text-xs font-semibold text-rose-600 border border-rose-200 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
                                  >
                                    Reset to defaults{activeOutletId ? " (outlet)" : " (org)"}
                                  </button>
                                </div>

                                {/* content */}
                                {permsLoading ? (
                                  <div className="flex items-center gap-2 text-slate-400 py-6">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading permissions...</span>
                                  </div>
                                ) : permsErr ? (
                                  <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-lg">
                                    {permsErr}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(MODULE_GROUPS).map(([moduleKey, modGroup]) => (
                                      <div key={moduleKey} className="bg-white p-4 rounded-xl border border-slate-200/50 shadow-xs">
                                        <h4 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 capitalize flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          {modGroup.name}
                                        </h4>
                                        <div className="divide-y divide-slate-100">
                                          {modGroup.resources.map((res) => (
                                            <div key={res.code} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                              <div className="min-w-0 pr-4">
                                                <p className="text-xs font-bold text-slate-800">{res.name}</p>
                                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{moduleKey}.{res.code}</p>
                                              </div>
                                              <div className="flex gap-1 shrink-0">
                                                {ACTIONS.map((action) => {
                                                  const perm      = getPermissionItem(role.id, moduleKey, res.code, action);
                                                  const isToggling = togglingPermId === perm?.id;

                                                  if (!perm) {
                                                    return (
                                                      <span key={action} className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border bg-slate-100 text-slate-300 border-transparent select-none">
                                                        {action.substring(0, 3)}
                                                      </span>
                                                    );
                                                  }

                                                  return (
                                                    <button
                                                      key={action}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTogglePermission(role.id, perm.id, perm.isEnabled, perm.isProtected);
                                                      }}
                                                      disabled={perm.isProtected || isToggling}
                                                      title={
                                                        perm.isProtected
                                                          ? "Protected — cannot modify"
                                                          : `Level: ${perm.level} — click to ${perm.isEnabled ? "disable" : "enable"}`
                                                      }
                                                      className={`
                                                        px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border select-none transition-all
                                                        ${perm.isEnabled
                                                          ? "bg-emerald-50 text-[#0f6b4a] border-emerald-200/50"
                                                          : "bg-slate-100 text-slate-300 border-transparent"
                                                        }
                                                        ${perm.isProtected ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-75"}
                                                        ${perm.isOverridden && !perm.isProtected ? "ring-1 ring-offset-1 ring-amber-400" : ""}
                                                      `}
                                                    >
                                                      {isToggling
                                                        ? <Loader2 className="w-2 h-2 animate-spin inline" />
                                                        : action.substring(0, 3)
                                                      }
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <div className="text-xs text-slate-400 order-2 sm:order-1">
            {filteredRoles.length > 0
              ? `Showing ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredRoles.length)}–${Math.min(currentPage * ITEMS_PER_PAGE, filteredRoles.length)} of ${filteredRoles.length} roles`
              : "No roles found"
            }
          </div>
          <div className="flex items-center gap-6 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors" title="Previous Page">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors" title="Next Page">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          toastMessage.type === "error" ? "bg-rose-900 text-white border-rose-800" : "bg-slate-900 text-white border-slate-800"
        }`}>
          <CheckCircle2 className={`h-4 w-4 shrink-0 ${toastMessage.type === "error" ? "text-rose-400" : "text-emerald-400"}`} />
          <span className="text-xs font-semibold">{toastMessage.msg}</span>
        </div>
      )}
    </div>
  );
}