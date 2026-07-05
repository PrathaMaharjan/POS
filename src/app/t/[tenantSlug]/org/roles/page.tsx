"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  Shield,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  ShieldCheck,
  Store,
  RefreshCw,
} from "lucide-react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface Role {
  id:          string;
  name:        string;
  description: string;
}

interface Outlet {
  id:   string;
  name: string;
}

interface Permission {
  id:        string;
  resource:  string;
  action:    string;
  isEnabled: boolean;
}

type PermissionsByModule = Record<string, Permission[]>;

// ─────────────────────────────────────────────
// CONSTANTS — unchanged from original
// ─────────────────────────────────────────────
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

const ITEMS_PER_PAGE = 8;

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function OrgRolesPage() {
  const { tenantSlug } = useParams();

  // ── org ──
  const [orgName, setOrgName] = useState<string>("");

  // ── outlets ──
  const [outlets,            setOutlets]            = useState<Outlet[]>([]);
  const [activeOutletId,     setActiveOutletId]     = useState<string>("");
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
  const [isOutletsLoading,   setIsOutletsLoading]   = useState(true);

  // ── roles ──
  const [roles,        setRoles]        = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // ── staff ──
  const [staffList,      setStaffList]      = useState<any[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(false);

  // ── permissions ──
  const [expandedRole,         setExpandedRole]         = useState<string | null>(null);
  const [rolePermissions,      setRolePermissions]      = useState<Record<string, PermissionsByModule>>({});
  const [isPermissionsLoading, setIsPermissionsLoading] = useState<Record<string, boolean>>({});
  const [permissionsError,     setPermissionsError]     = useState<Record<string, string | null>>({});

  // ── ui ──
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "system" | "custom" | "active" | "inactive">("ALL");
  const [currentPage,  setCurrentPage]  = useState(1);

  // ── cache only used for hover prefetch
  //    NOT used to skip on expand (avoids stale data)
  const permCache = useRef<Record<string, PermissionsByModule>>({});

  // ─────────────────────────────────────────────
  // 1. LOAD ORG NAME
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await api.get("/org/tenant");
        setOrgName(res.data?.name ?? "");
      } catch {
        if (tenantSlug) {
          setOrgName(
            String(tenantSlug)
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")
          );
        }
      }
    }
    fetchOrg();
  }, [tenantSlug]);

  // ─────────────────────────────────────────────
  // 2. LOAD OUTLETS + ROLES in parallel on mount
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setIsOutletsLoading(true);
      setRolesLoading(true);
      try {
        const [outletsRes, rolesRes] = await Promise.all([
          api.get("/outlets"),
          api.get("/org/role"), // organizationId from JWT
        ]);

        // outlets
        const outletList: Outlet[] = outletsRes.data.outlets ?? [];
        setOutlets(outletList);
        if (outletList.length > 0) {
          const stored = localStorage.getItem("activeOutletId");
          const valid  = stored && outletList.some((o) => o.id === stored);
          setActiveOutletId(valid ? stored! : outletList[0].id);
        }

        // roles
        const roleList: Role[] = (rolesRes.data.roles ?? []).map((r: any) => ({
          id:          r.id,
          name:        r.name,
          description: r.description ?? "",
        }));
        setRoles(roleList);
      } catch (err) {
        console.error("Failed to load outlets / roles", err);
      } finally {
        setIsOutletsLoading(false);
        setRolesLoading(false);
      }
    }
    load();
  }, []);

  // ─────────────────────────────────────────────
  // 3. LOAD STAFF when outlet changes
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeOutletId) return;
    async function loadStaff() {
      setIsStaffLoading(true);
      try {
        const res = await api.get(`/staff?outletId=${activeOutletId}&limit=100`);
        setStaffList(res.data.staff ?? []);
      } catch (err) {
        console.error("Failed to load staff for user counts", err);
      } finally {
        setIsStaffLoading(false);
      }
    }
    loadStaff();
  }, [activeOutletId]);

  // ─────────────────────────────────────────────
  // 4. BACKGROUND PREFETCH — hover prefetch only
  //    Does NOT skip re-fetch on expand
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (roles.length === 0) return;
    roles.forEach((role) => {
      if (permCache.current[role.id]) return;
      api
        .get("/permission", { params: { roleId: role.id } })
        .then(({ data }) => {
          const perms: PermissionsByModule = data.permissions ?? {};
          permCache.current[role.id] = perms;
          // only set state if this role is NOT currently expanded
          // so we don't overwrite a fresh fetch with a stale prefetch
          setRolePermissions((prev) => {
            if (prev[role.id]) return prev; // already has fresh data, don't overwrite
            return { ...prev, [role.id]: perms };
          });
        })
        .catch(() => {});
    });
  }, [roles]);

  // ─────────────────────────────────────────────
  // 5. FETCH PERMISSIONS — always hits API fresh
  //    Does NOT serve from cache to avoid stale data
  //    when superadmin changes permissions
  // ─────────────────────────────────────────────
  // const fetchPermissions = async (roleId: string) => {
  //   setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: true }));
  //   setPermissionsError((prev)     => ({ ...prev, [roleId]: null }));
  //   try {
  //     const { data } = await api.get("/permission", { params: { roleId } });
  //     const perms: PermissionsByModule = data.permissions ?? {};
  //     // update both cache and state with fresh data
  //     permCache.current[roleId] = perms;
  //     setRolePermissions((prev) => ({ ...prev, [roleId]: perms }));
  //   } catch (err: any) {
  //     const msg = err.response?.data?.error ?? "Failed to load permissions";
  //     setPermissionsError((prev) => ({ ...prev, [roleId]: msg }));
  //   } finally {
  //     setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: false }));
  //   }
  // };

const fetchPermissions = async (roleId: string) => {
  setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: true }));
  setPermissionsError((prev)     => ({ ...prev, [roleId]: null }));
  try {
    const params: Record<string, string> = { roleId };

    // ✅ pass activeOutletId so backend fetches outlet-level overrides
    if (activeOutletId) params.outletId = activeOutletId;

    const { data } = await api.get("/permission", { params });
    const perms: PermissionsByModule = data.permissions ?? {};
    permCache.current[roleId] = perms;
    setRolePermissions((prev) => ({ ...prev, [roleId]: perms }));
  } catch (err: any) {
    const msg = err.response?.data?.error ?? "Failed to load permissions";
    setPermissionsError((prev) => ({ ...prev, [roleId]: msg }));
  } finally {
    setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: false }));
  }
};

  // ── expand/collapse — ALWAYS re-fetches fresh data ──
  // no "if (!rolePermissions[roleId])" guard
  // so superadmin changes are always reflected
  const handleToggleExpand = async (roleId: string) => {
    if (expandedRole === roleId) { setExpandedRole(null); return; }
    setExpandedRole(roleId);
    await fetchPermissions(roleId); // ← always fresh, never skipped
  };

  // ── manual refresh inside expanded row ──
  const handleRefreshPermissions = async (e: React.MouseEvent, roleId: string) => {
    e.stopPropagation();
    delete permCache.current[roleId]; // clear stale cache
    await fetchPermissions(roleId);   // fetch fresh from DB
  };

  // ── hover prefetch — starts loading before user clicks ──
  // const handleRowHover = (roleId: string) => {
  //   if (!permCache.current[roleId] && !isPermissionsLoading[roleId]) {
  //     // only prefetch if not cached — this is just a speed optimisation
  //     // the real fresh fetch happens on expand
  //     api
  //       .get("/permission", { params: { roleId } })
  //       .then(({ data }) => {
  //         const perms: PermissionsByModule = data.permissions ?? {};
  //         permCache.current[roleId] = perms;
  //         setRolePermissions((prev) => {
  //           if (prev[roleId]) return prev;
  //           return { ...prev, [roleId]: perms };
  //         });
  //       })
  //       .catch(() => {});
  //   }
  // };
const handleRowHover = (roleId: string) => {
  if (!permCache.current[roleId] && !isPermissionsLoading[roleId]) {
    const params: Record<string, string> = { roleId };
    if (activeOutletId) params.outletId = activeOutletId; // ← add this

    api
      .get("/permission", { params }) // ← use params not just roleId
      .then(({ data }) => {
        const perms: PermissionsByModule = data.permissions ?? {};
        permCache.current[roleId] = perms;
        setRolePermissions((prev) => {
          if (prev[roleId]) return prev;
          return { ...prev, [roleId]: perms };
        });
      })
      .catch(() => {});
  }
};
  // ── close dropdown on outside click ──
  useEffect(() => {
    if (!outletDropdownOpen) return;
    const handleOutsideClick = () => setOutletDropdownOpen(false);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [outletDropdownOpen]);

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  const activeOutletName = useMemo(
    () => outlets.find((o) => o.id === activeOutletId)?.name ?? "Select Outlet",
    [activeOutletId, outlets]
  );

const handleOutletChange = (id: string) => {
  setActiveOutletId(id);
  setCurrentPage(1);
  setExpandedRole(null);
  permCache.current = {};              // ← clear all cached permissions
  setRolePermissions({});             // ← clear state too
  setOutletDropdownOpen(false);
};

  const getRoleUserCount = (roleName: string) => {
    if (staffList.length > 0) {
      return staffList.filter((member) => {
        const staffRole = member.role?.toLowerCase() ?? "";
        const name      = roleName.toLowerCase();
        if (name === "manager")      return staffRole === "manager" || staffRole === "branch manager";
        if (name === "cashier")      return staffRole === "cashier";
        if (name === "waiter")       return staffRole === "waiter";
        if (name === "kitchen crew") return staffRole === "kitchen" || staffRole === "kitchen crew";
        return false;
      }).length;
    }
    return 0;
  };

  const hasPermission = (roleId: string, module: string, resource: string, action: string) => {
    const modulePerms = rolePermissions[roleId]?.[module] ?? [];
    return modulePerms.find((p) => p.resource === resource && p.action === action)?.isEnabled ?? false;
  };

  // ─────────────────────────────────────────────
  // FILTERED + PAGINATED
  // ─────────────────────────────────────────────
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const q = search.toLowerCase();
      const matchesSearch =
        role.name.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q);
      let matchesStatus = true;
      if (statusFilter === "active")   matchesStatus = true;
      if (statusFilter === "inactive") matchesStatus = false;
      return matchesSearch && matchesStatus;
    });
  }, [roles, search, statusFilter]);

  const stats = useMemo(() => {
    const hasFilters = search.trim() !== "" || statusFilter !== "ALL";
    const src        = hasFilters ? filteredRoles : roles;
    return { total: src.length, active: src.length, hasFilters };
  }, [roles, filteredRoles, search, statusFilter]);

  const totalPages     = Math.ceil(filteredRoles.length / ITEMS_PER_PAGE);
  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRoles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRoles, currentPage]);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 select-none">

      {/* ── HEADER — unchanged ── */}
      <div className="rounded-xl bg-[#0f6b4a] px-6 py-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-visible">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Organization Roles</h1>
        </div>

        <div className="relative z-[100]" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOutletDropdownOpen((prev) => !prev)}
            disabled={isOutletsLoading || outlets.length === 0}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border bg-white text-emerald-700 border-white shadow-sm transition-colors hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              {isOutletsLoading
                ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                : <Store className="w-4 h-4 shrink-0" />
              }
              <span className="max-w-[150px] truncate">{activeOutletName}</span>
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
                      activeOutletId === ot.id
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${activeOutletId === ot.id ? "bg-emerald-500" : "bg-slate-200"}`} />
                    {ot.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STATS — unchanged ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label:  stats.hasFilters ? "Filtered Roles" : "Total Roles",
            value:  rolesLoading ? "..." : stats.total,
            border: "border-l-slate-400",
            iconBg: "bg-slate-50 text-slate-600",
            icon:   <Shield className="h-5 w-5 sm:h-6 sm:w-6" />,
          },
          {
            label:  stats.hasFilters ? "Filtered Active" : "Active Templates",
            value:  rolesLoading ? "..." : stats.active,
            border: "border-l-[#18a172]",
            iconBg: "bg-emerald-50 text-emerald-600",
            icon:   <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />,
          },
          {
            label:  "Active Outlet Staff",
            value:  isStaffLoading ? "..." : staffList.length,
            border: "border-l-blue-500",
            iconBg: "bg-blue-50 text-blue-600",
            icon:   <Users className="h-5 w-5 sm:h-6 sm:w-6" />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border-l-4 ${s.border} border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between`}
          >
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

      {/* ── SEARCH — unchanged ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search role name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {rolesLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-slate-100 rounded animate-pulse ml-6" />
                <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto whitespace-nowrap lg:whitespace-normal">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Role Name</th>
                  <th className="py-3.5 px-6">Assigned in Outlet</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRoles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-16 text-center text-sm text-slate-400">
                      No roles match your search filter configuration.
                    </td>
                  </tr>
                ) : paginatedRoles.map((role) => {
                  const isExpanded       = expandedRole === role.id;
                  const permsLoading     = isPermissionsLoading[role.id] ?? false;
                  const permsErr         = permissionsError[role.id]     ?? null;
                  const outletUsersCount = getRoleUserCount(role.name);

                  return (
                    <React.Fragment key={role.id}>

                      {/* ── ROW ── */}
                      <tr
                        onClick={() => handleToggleExpand(role.id)}
                        onMouseEnter={() => handleRowHover(role.id)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {role.name}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{isStaffLoading ? "..." : `${outletUsersCount} assigned`}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Active
                          </span>
                        </td>
                      </tr>

                      {/* ── EXPANDED PERMISSIONS ── */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={3} className="px-6 py-5">
                            <div className="animate-in fade-in duration-200">
                              <div className="w-full min-w-0">

                                {/* header + refresh button */}
                                <div className="flex items-center gap-2 mb-4">
                                  <Shield className="w-4 h-4 text-emerald-600" />
                                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Permission Catalog
                                  </h3>

                                  {/* ── REFRESH — clears cache + fetches fresh ── */}
                                  <button
                                    onClick={(e) => handleRefreshPermissions(e, role.id)}
                                    disabled={permsLoading}
                                    className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 bg-white px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
                                    title="Refresh permissions from database"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${permsLoading ? "animate-spin" : ""}`} />
                                    Refresh
                                  </button>
                                </div>

                                {/* loading */}
                                {permsLoading ? (
                                  <div className="flex items-center gap-2 text-slate-400 py-6">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading permissions...</span>
                                  </div>
                                ) : permsErr ? (
                                  <div className="flex items-center justify-between text-sm text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-lg">
                                    <span>{permsErr}</span>
                                    <button
                                      onClick={(e) => handleRefreshPermissions(e, role.id)}
                                      className="text-xs font-bold underline ml-3"
                                    >
                                      Retry
                                    </button>
                                  </div>
                                ) : (
                                  /* permission grid — identical layout to original */
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(MODULE_GROUPS).map(([moduleKey, modGroup]) => (
                                      <div key={moduleKey} className="bg-white p-4 rounded-xl border border-slate-200/50 shadow-xs">
                                        <h4 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 capitalize flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#0f6b4a]" />
                                          {modGroup.name}
                                        </h4>
                                        <div className="divide-y divide-slate-100">
                                          {modGroup.resources.map((res) => (
                                            <div
                                              key={res.code}
                                              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                                            >
                                              <div className="min-w-0 pr-4">
                                                <p className="text-xs font-bold text-slate-800">{res.name}</p>
                                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{moduleKey}.{res.code}</p>
                                              </div>
                                              <div className="flex gap-1 shrink-0">
                                                {["create", "read", "update", "delete"].map((action) => {
                                                  const isAllowed = hasPermission(role.id, moduleKey, res.code, action);
                                                  return (
                                                    <span
                                                      key={action}
                                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border select-none ${
                                                        isAllowed
                                                          ? "bg-emerald-50 text-[#0f6b4a] border-emerald-200/50"
                                                          : "bg-slate-100 text-slate-300 border-transparent"
                                                      }`}
                                                    >
                                                      {action.substring(0, 3)}
                                                    </span>
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

        {/* ── PAGINATION — unchanged ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <div className="text-xs text-slate-400 order-2 sm:order-1">
            {filteredRoles.length > 0
              ? `Showing ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredRoles.length)}–${Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredRoles.length
                )} of ${filteredRoles.length} roles`
              : "No roles found"
            }
          </div>
          <div className="flex items-center gap-6 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Next Page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}