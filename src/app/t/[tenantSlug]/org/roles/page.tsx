"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  Shield,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  Building2,
  Users,
  Settings2,
  ShieldCheck,
  Check,
  Store,
} from "lucide-react";

interface Role {
  id: string;
  code: string;
  name: string;
  type: "system" | "custom";
  isActive: boolean;
  description: string;
  permissions: string[];
}

interface Outlet {
  id: string;
  name: string;
}

const MODULE_GROUPS = {
  pos: {
    name: "POS Operations",
    resources: [
      { code: "billing", name: "Billing" },
      { code: "payments", name: "Payments" },
    ],
  },
  restaurant: {
    name: "Restaurant / Dining",
    resources: [
      { code: "tables", name: "Tables" },
      { code: "kot", name: "KOT (Kitchen Order Tickets)" },
    ],
  },
  inventory: {
    name: "Inventory Management",
    resources: [
      { code: "categories", name: "Categories" },
      { code: "products", name: "Products" },
      { code: "stock", name: "Stock Tracking" },
      { code: "recipes", name: "Recipes" },
    ],
  },
  core: {
    name: "Core Administration",
    resources: [
      { code: "outlets", name: "Outlets" },
      { code: "users", name: "Users" },
      { code: "roles", name: "Roles" },
    ],
  },
};

const SYSTEM_ROLES_TEMPLATES = [
  {
    code: "MANAGER",
    name: "Manager",
    description: "Operational management permissions including staff management, reports, menu editing, and outlets layout.",
    permissions: [] as string[],
  },
  {
    code: "CASHIER",
    name: "Cashier",
    description: "Front-desk checkout permissions: processing orders, managing tables, taking payments, and viewing takeaway queues.",
    permissions: [
      "inventory.products.read",
      "pos.billing.create", "pos.billing.read", "pos.billing.update",
      "pos.payments.create", "pos.payments.read",
      "restaurant.tables.read", "restaurant.tables.update",
      "restaurant.kot.read", "restaurant.kot.update"
    ],
  },
  {
    code: "WAITER",
    name: "Waiter",
    description: "Table service permissions: view tables, take dine-in orders, and manage kitchen ticket creation.",
    permissions: [
      "inventory.products.read",
      "restaurant.tables.read", "restaurant.tables.update",
      "restaurant.kot.create", "restaurant.kot.read", "restaurant.kot.update",
      "pos.billing.create", "pos.billing.read", "pos.billing.update",
      "pos.payments.create", "pos.payments.read"
    ],
  },
  {
    code: "KITCHEN",
    name: "Kitchen Crew",
    description: "Kitchen display monitor access. View, prepare, and complete items in the preparation queue.",
    permissions: [
      "restaurant.kot.read", "restaurant.kot.update",
      "inventory.stock.read", "inventory.stock.update"
    ],
  }
];


const ALL_PERMISSIONS_LIST: string[] = [];
const ACTIONS = ["create", "read", "update", "delete"];
Object.entries(MODULE_GROUPS).forEach(([module, group]) => {
  group.resources.forEach((res) => {
    ACTIONS.forEach((action) => {
      ALL_PERMISSIONS_LIST.push(`${module}.${res.code}.${action}`);
    });
  });
});

SYSTEM_ROLES_TEMPLATES[0].permissions = ALL_PERMISSIONS_LIST.filter((p) => {
  return p !== "core.outlets.delete" && p !== "core.roles.delete";
});

export default function OrgRolesPage() {
  const { tenantSlug } = useParams();
  const [orgName, setOrgName] = useState<string>("");
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeOutletId, setActiveOutletId] = useState<string>("");
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
  const [isOutletsLoading, setIsOutletsLoading] = useState(true);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "system" | "custom" | "active" | "inactive">("ALL");
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 8;


  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await api.get("/org/tenant");
        if (res.data) {
          setOrgName(res.data.name || "");
        }
      } catch (err) {
        console.error("Error fetching organization name:", err);

        if (tenantSlug) {
          const formatted = String(tenantSlug)
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          setOrgName(formatted);
        }
      }
    }
    fetchOrg();
  }, [tenantSlug]);


  useEffect(() => {
    async function loadOutlets() {
      setIsOutletsLoading(true);
      try {
        const resOutlets = await api.get("/outlets");
        const list = resOutlets.data.outlets ?? [];
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
        console.error("Failed to load outlets from API", err);
      } finally {
        setIsOutletsLoading(false);
      }
    }
    loadOutlets();
  }, []);

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


  useEffect(() => {
    if (!outletDropdownOpen) return;
    const handleOutsideClick = () => setOutletDropdownOpen(false);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [outletDropdownOpen]);

  const activeOutletName = useMemo(() => {
    return outlets.find((o) => o.id === activeOutletId)?.name ?? "Select Outlet";
  }, [activeOutletId, outlets]);


  const roles = useMemo<Role[]>(() => {
    return SYSTEM_ROLES_TEMPLATES.map((tmpl) => ({
      id: tmpl.code,
      code: tmpl.code,
      name: tmpl.name,
      type: "system",
      isActive: true,
      description: tmpl.description,
      permissions: tmpl.permissions,
    }));
  }, []);

  const handleOutletChange = (id: string) => {
    setActiveOutletId(id);
    setCurrentPage(1);
    setExpandedRole(null);
    setOutletDropdownOpen(false);
  };

  const getRoleUserCount = (roleName: string) => {
    if (staffList.length > 0) {
      return staffList.filter((member) => {
        const staffRole = member.role?.toLowerCase() ?? "";
        const name = roleName.toLowerCase();

        if (name === "manager") return staffRole === "manager" || staffRole === "branch manager";
        if (name === "cashier") return staffRole === "cashier";
        if (name === "waiter") return staffRole === "waiter";
        if (name === "kitchen crew") return staffRole === "kitchen" || staffRole === "kitchen crew";
        return false;
      }).length;
    }
    return 0;
  };


  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const q = search.toLowerCase();
      const matchesSearch =
        role.name.toLowerCase().includes(q) ||
        role.code.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === "system") {
        matchesStatus = role.type === "system";
      } else if (statusFilter === "custom") {
        matchesStatus = role.type === "custom";
      } else if (statusFilter === "active") {
        matchesStatus = role.isActive;
      } else if (statusFilter === "inactive") {
        matchesStatus = !role.isActive;
      }

      return matchesSearch && matchesStatus;
    });
  }, [roles, search, statusFilter]);


  const stats = useMemo(() => {
    const total = roles.length;
    const active = roles.filter((r) => r.isActive).length;
    const inactive = roles.filter((r) => !r.isActive).length;

    const filteredTotal = filteredRoles.length;
    const filteredActive = filteredRoles.filter((r) => r.isActive).length;
    const filteredInactive = filteredRoles.filter((r) => !r.isActive).length;

    const hasFilters = search.trim() !== "" || statusFilter !== "ALL";

    return {
      total: hasFilters ? filteredTotal : total,
      active: hasFilters ? filteredActive : active,
      inactive: hasFilters ? filteredInactive : inactive,
      hasFilters,
    };
  }, [roles, filteredRoles, search, statusFilter]);


  const totalPages = Math.ceil(filteredRoles.length / ITEMS_PER_PAGE);
  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRoles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRoles, currentPage]);

  const hasPermission = (rolePermissions: string[], module: string, resource: string, action: string) => {
    const code = `${module}.${resource}.${action}`;
    return rolePermissions.includes(code);
  };

  return (
    <div className="flex flex-col gap-6 select-none">

      <div className="rounded-xl bg-[#0f6b4a] px-6 py-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Organization Roles</h1>

        </div>


        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOutletDropdownOpen((prev) => !prev)}
            disabled={isOutletsLoading || outlets.length === 0}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border bg-white text-emerald-700 border-white shadow-sm transition-colors hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              {isOutletsLoading ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              ) : (
                <Store className="w-4 h-4 shrink-0" />
              )}
              <span className="max-w-[150px] truncate">{activeOutletName}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${outletDropdownOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {outletDropdownOpen && outlets.length > 0 && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-700 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Outlet Scope
                </p>
              </div>
              <div className="py-1 max-h-60 overflow-y-auto">
                {outlets.map((ot) => (
                  <button
                    key={ot.id}
                    onClick={() => handleOutletChange(ot.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${activeOutletId === ot.id
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${activeOutletId === ot.id ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                    />
                    {ot.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: stats.hasFilters ? "Filtered Roles" : "Total Roles",
            value: stats.total,
            border: "border-l-slate-400",
            iconBg: "bg-slate-50 text-slate-600",
            icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6" />,
          },
          {
            label: stats.hasFilters ? "Filtered Active" : "Active Templates",
            value: stats.active,
            border: "border-l-[#18a172]",
            iconBg: "bg-emerald-50 text-emerald-600",
            icon: <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />,
          },
          {
            label: "Active Outlet Staff",
            value: isStaffLoading ? "..." : staffList.length,
            border: "border-l-blue-500",
            iconBg: "bg-blue-50 text-blue-600",
            icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />,
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


      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search role name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>


      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
              ) : (
                paginatedRoles.map((role) => {
                  const isExpanded = expandedRole === role.id;
                  const outletUsersCount = getRoleUserCount(role.name);
                  return (
                    <React.Fragment key={role.id}>
                      {/* Table Row */}
                      <tr
                        onClick={() => setExpandedRole(isExpanded ? null : role.id)}
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

                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={3} className="px-6 py-5">
                            <div className="animate-in fade-in duration-200">

                              <div className="w-full min-w-0">
                                <div className="flex items-center gap-2 mb-4">
                                  <Shield className="w-4 h-4 text-emerald-600" />
                                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Permission Catalog
                                  </h3>
                                </div>
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
                                                const isAllowed = hasPermission(role.permissions, moduleKey, res.code, action);
                                                return (
                                                  <span
                                                    key={action}
                                                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border select-none ${isAllowed
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
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>


        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <div className="text-xs text-slate-400 order-2 sm:order-1">
            {filteredRoles.length > 0
              ? `Showing ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredRoles.length)}–${Math.min(
                currentPage * ITEMS_PER_PAGE,
                filteredRoles.length
              )} of ${filteredRoles.length} roles`
              : "No roles found"}
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
