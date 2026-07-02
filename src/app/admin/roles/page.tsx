"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Shield,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Info,
  Building2,
  Users,
  Settings2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Check,
  Store,
} from "lucide-react";

interface Role {
  id: string;
  code: string;
  name: string;
  orgId: string;
  orgName: string;
  type: "system" | "custom";
  isActive: boolean;
  createdAt: string;
  description: string;
  permissions: string[];
}

interface Organization {
  id: string;
  name: string;
}

interface Outlet {
  id: string;
  name: string;
}

const DEFAULT_ORGANIZATIONS: Organization[] = [
  { id: "system", name: "Abstrakt POS (System)" },
  { id: "mcd", name: "McDonald's" },
  { id: "sbux", name: "Starbucks" },
  { id: "bk", name: "Burger King" },
  { id: "kfc", name: "KFC" },
];

const MOCK_OUTLETS: Record<string, Outlet[]> = {
  system: [
    { id: "sys-hq", name: "System Headquarters" },
    { id: "sys-dev", name: "Development Hub" },
  ],
  mcd: [
    { id: "mcd-times-sq", name: "McDonald's Times Square" },
    { id: "mcd-mall-of-am", name: "McDonald's Mall of America" },
    { id: "mcd-main", name: "McDonald's Main Branch" },
  ],
  sbux: [
    { id: "sbux-downtown", name: "Starbucks Downtown" },
    { id: "sbux-uptown", name: "Starbucks Uptown" },
    { id: "sbux-airport", name: "Starbucks Airport" },
  ],
  bk: [
    { id: "bk-drive-thru", name: "BK Drive Thru" },
    { id: "bk-main", name: "BK Main Street" },
  ],
  kfc: [
    { id: "kfc-expressway", name: "KFC Expressway" },
    { id: "kfc-center", name: "KFC Center Plaza" },
  ],
};

const MOCK_OUTLET_USER_COUNTS: Record<string, Record<string, number>> = {
  // McDonalds Times Square
  "mcd-times-sq": { Owner: 1, Manager: 2, Cashier: 12, Waiter: 8, "Kitchen Crew": 15, "All Rounder": 4, "Shift Supervisor": 3 },
  // McDonalds Mall of America
  "mcd-mall-of-am": { Owner: 1, Manager: 3, Cashier: 18, Waiter: 14, "Kitchen Crew": 22, "All Rounder": 6, "Shift Supervisor": 5 },
  // McDonalds Main Branch
  "mcd-main": { Owner: 1, Manager: 2, Cashier: 10, Waiter: 6, "Kitchen Crew": 12, "All Rounder": 2, "Shift Supervisor": 2 },

  // Starbucks Downtown
  "sbux-downtown": { Owner: 1, Manager: 1, Cashier: 8, Waiter: 0, "Kitchen Crew": 6, "All Rounder": 3, Barista: 10 },
  // Starbucks Uptown
  "sbux-uptown": { Owner: 1, Manager: 1, Cashier: 6, Waiter: 0, "Kitchen Crew": 4, "All Rounder": 2, Barista: 8 },
  // Starbucks Airport
  "sbux-airport": { Owner: 0, Manager: 2, Cashier: 15, Waiter: 0, "Kitchen Crew": 10, "All Rounder": 5, Barista: 12 },

  // BK Drive Thru
  "bk-drive-thru": { Owner: 1, Manager: 2, Cashier: 9, Waiter: 4, "Kitchen Crew": 8, "All Rounder": 2, "Assistant Store Lead": 2 },
  // BK Main Street
  "bk-main": { Owner: 1, Manager: 1, Cashier: 7, Waiter: 3, "Kitchen Crew": 6, "All Rounder": 1, "Assistant Store Lead": 1 },

  // KFC Expressway
  "kfc-expressway": { Owner: 1, Manager: 2, Cashier: 11, Waiter: 5, "Kitchen Crew": 10, "All Rounder": 3, "Delivery Dispatcher": 4 },
  // KFC Center Plaza
  "kfc-center": { Owner: 1, Manager: 1, Cashier: 8, Waiter: 4, "Kitchen Crew": 7, "All Rounder": 2, "Delivery Dispatcher": 3 },

  // System fallback
  "sys-hq": { Owner: 4, Manager: 5, Cashier: 20, Waiter: 10, "Kitchen Crew": 15, "All Rounder": 8 },
  "sys-dev": { Owner: 2, Manager: 2, Cashier: 5, Waiter: 2, "Kitchen Crew": 4, "All Rounder": 1 },
};

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
    code: "OWNER",
    name: "Owner",
    description: "Full administrative access with control over all configurations, outlets, and system security.",
    permissions: [] as string[], // Populated programmatically
  },
  {
    code: "MANAGER",
    name: "Manager",
    description: "Operational management permissions including staff management, reports, menu editing, and outlets layout.",
    permissions: [] as string[], // Populated programmatically
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

// Populate Owner and Manager permissions programmatically
const ALL_PERMISSIONS_LIST: string[] = [];
const ACTIONS = ["create", "read", "update", "delete"];
Object.entries(MODULE_GROUPS).forEach(([module, group]) => {
  group.resources.forEach((res) => {
    ACTIONS.forEach((action) => {
      ALL_PERMISSIONS_LIST.push(`${module}.${res.code}.${action}`);
    });
  });
});

SYSTEM_ROLES_TEMPLATES[0].permissions = [...ALL_PERMISSIONS_LIST];
SYSTEM_ROLES_TEMPLATES[1].permissions = ALL_PERMISSIONS_LIST.filter((p) => {
  return p !== "core.outlets.delete" && p !== "core.roles.delete";
});

const getRolesForOrg = (orgId: string, orgName: string) => {
  // Start with system template roles
  const baseRoles: Role[] = SYSTEM_ROLES_TEMPLATES.map((tmpl) => ({
    id: `${tmpl.code}-${orgId}`,
    code: tmpl.code,
    name: tmpl.name,
    orgId: orgId,
    orgName: orgName,
    type: "system",
    isActive: true,
    createdAt: "2026-01-10T08:00:00.000Z",
    description: tmpl.description,
    permissions: tmpl.permissions,
  }));

  // Append organization-specific custom roles
  if (orgId === "mcd" || orgName.toLowerCase().includes("mcdonald")) {
    baseRoles.push({
      id: `custom-mcd-shift-lead-${orgId}`,
      code: "MCD_SHIFT_LEAD",
      name: "Shift Supervisor",
      orgId: orgId,
      orgName: orgName,
      type: "custom",
      isActive: true,
      createdAt: "2026-03-05T07:45:00.000Z",
      description: "Custom role for supervising daily shift operations, managing active tables, and resolving cashier register issues.",
      permissions: [
        "pos.billing.create", "pos.billing.read", "pos.billing.update",
        "restaurant.tables.read", "restaurant.tables.update",
        "restaurant.kot.read", "restaurant.kot.update",
        "pos.payments.create", "pos.payments.read"
      ],
    });
  } else if (orgId === "sbux" || orgName.toLowerCase().includes("starbucks")) {
    baseRoles.push({
      id: `custom-sbux-barista-${orgId}`,
      code: "SBUX_BARISTA",
      name: "Barista",
      orgId: orgId,
      orgName: orgName,
      type: "custom",
      isActive: true,
      createdAt: "2026-04-12T06:15:00.000Z",
      description: "Custom role for taking coffee orders, executing drink assembly, and checking takeaway pickup queues.",
      permissions: [
        "inventory.products.read",
        "pos.payments.create",
        "pos.payments.read"
      ],
    });
  } else if (orgId === "bk" || orgName.toLowerCase().includes("burger")) {
    baseRoles.push({
      id: `custom-bk-assistant-${orgId}`,
      code: "BK_ASSISTANT",
      name: "Assistant Store Lead",
      orgId: orgId,
      orgName: orgName,
      type: "custom",
      isActive: false,
      createdAt: "2026-05-18T13:22:00.000Z",
      description: "Custom management assistant role responsible for menu pricing audits, sales reporting, and team scheduling.",
      permissions: [
        "pos.billing.read",
        "inventory.products.read", "inventory.products.update",
        "core.users.read", "core.users.update"
      ],
    });
  } else if (orgId === "kfc" || orgName.toLowerCase().includes("kfc")) {
    baseRoles.push({
      id: `custom-kfc-dispatch-${orgId}`,
      code: "KFC_DISPATCH",
      name: "Delivery Dispatcher",
      orgId: orgId,
      orgName: orgName,
      type: "custom",
      isActive: true,
      createdAt: "2026-06-01T15:00:00.000Z",
      description: "Custom order delivery routing role. Manages takeaway packaging state and coordinates driver handoffs.",
      permissions: [
        "restaurant.kot.read",
        "pos.billing.read"
      ],
    });
  }

  return baseRoles;
};

const getHeaders = (extraHeaders: Record<string, string> = {}) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      return {
        ...extraHeaders,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return extraHeaders;
};

export default function SuperAdminRolesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeOutletId, setActiveOutletId] = useState<string>("");
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
  const [isOutletsLoading, setIsOutletsLoading] = useState(false);

  const [roleStatusMap, setRoleStatusMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "system" | "custom" | "active" | "inactive">("ALL");
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Permissions States
  const [rolePermissions, setRolePermissions] = useState<Record<string, any>>({});
  const [isPermissionsLoading, setIsPermissionsLoading] = useState<Record<string, boolean>>({});
  const [permissionsError, setPermissionsError] = useState<Record<string, string | null>>({});

  // Permission API fetch call
  const fetchPermissions = async (roleId: string) => {
    setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: true }));
    setPermissionsError((prev) => ({ ...prev, [roleId]: null }));
    try {
      const res = await fetch(`/api/permission?roleId=${roleId}`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch permissions");
      }
      const data = await res.json();
      setRolePermissions((prev) => ({ ...prev, [roleId]: data.permissions }));
    } catch (err: any) {
      console.error("fetchPermissions error:", err);
      setPermissionsError((prev) => ({ ...prev, [roleId]: err.message || "Failed to load permissions" }));
    } finally {
      setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: false }));
    }
  };

  // Permission PATCH API call
  const handleTogglePermission = async (roleId: string, permissionId: string, currentEnabled: boolean) => {
    const nextState = !currentEnabled;
    // Optimistic UI update
    setRolePermissions((prev) => {
      const rolePerms = prev[roleId] ? { ...prev[roleId] } : {};
      Object.keys(rolePerms).forEach((moduleKey) => {
        rolePerms[moduleKey] = rolePerms[moduleKey].map((p: any) => {
          if (p.id === permissionId) {
            return { ...p, isEnabled: nextState };
          }
          return p;
        });
      });
      return { ...prev, [roleId]: rolePerms };
    });

    try {
      const res = await fetch("/api/permission", {
        method: "PATCH",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          roleId,
          permissionId,
          isEnabled: nextState,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update permission");
      }
      showToast("Permission updated successfully");
    } catch (err: any) {
      console.error("Toggle permission error:", err);
      showToast(err.message || "Failed to update permission");
      // Revert optimistic update
      setRolePermissions((prev) => {
        const rolePerms = prev[roleId] ? { ...prev[roleId] } : {};
        Object.keys(rolePerms).forEach((moduleKey) => {
          rolePerms[moduleKey] = rolePerms[moduleKey].map((p: any) => {
            if (p.id === permissionId) {
              return { ...p, isEnabled: currentEnabled };
            }
            return p;
          });
        });
        return { ...prev, [roleId]: rolePerms };
      });
    }
  };

  // Revert / Reset permissions API call
  const handleResetPermissions = async (roleId: string) => {
    setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: true }));
    try {
      const res = await fetch("/api/permission/reset", {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ roleId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to reset permissions");
      }
      showToast("Permissions reverted to global defaults");
      await fetchPermissions(roleId);
    } catch (err: any) {
      console.error("Reset permissions error:", err);
      showToast(err.message || "Failed to reset permissions");
    } finally {
      setIsPermissionsLoading((prev) => ({ ...prev, [roleId]: false }));
    }
  };

  // Toggle detail view panel
  const handleToggleExpand = (roleId: string) => {
    setExpandedRole(expandedRole === roleId ? null : roleId);
  };

  // Helper to lookup permission items in the API-driven list
  const getPermissionItem = (roleId: string, module: string, resource: string, action: string) => {
    const modulePerms = rolePermissions[roleId]?.[module] ?? [];
    return modulePerms.find((p: any) => p.resource === resource && p.action === action);
  };

  // Helper count methods
  const getActivePermissionsCount = (roleId: string) => {
    const rolePerms = rolePermissions[roleId];
    if (!rolePerms) return 0;
    let count = 0;
    Object.values(rolePerms).forEach((moduleList: any) => {
      moduleList.forEach((p: any) => {
        if (p.isEnabled) count++;
      });
    });
    return count;
  };

  const getTotalPermissionsCount = (roleId: string) => {
    const rolePerms = rolePermissions[roleId];
    if (!rolePerms) return 0;
    let count = 0;
    Object.values(rolePerms).forEach((moduleList: any) => {
      count += moduleList.length;
    });
    return count;
  };

  const ITEMS_PER_PAGE = 8;

  // Fetch Organizations
  useEffect(() => {
    async function loadOrgs() {
      setIsLoading(true);
      let list: Organization[] = [];
      try {
        const res = await fetch("/api/superadmin/organization", {
          headers: getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.organizations && data.organizations.length > 0) {
            list = data.organizations.map((org: any) => ({
              id: org.id,
              name: org.name,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load organizations from API, using defaults", err);
      }

      if (list.length === 0) {
        list = DEFAULT_ORGANIZATIONS;
      }

      setOrganizations(list);
      if (list.length > 0) {
        setActiveOrgId(list[0].id);
      }
      setIsLoading(false);
    }
    loadOrgs();
  }, []);

  // Fetch Outlets when activeOrgId changes
  useEffect(() => {
    if (!activeOrgId) return;

    async function loadOutlets() {
      setIsOutletsLoading(true);
      let list: Outlet[] = [];
      try {
        const res = await fetch(`/api/superadmin/organization/${activeOrgId}`, {
          headers: getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.outlets && data.outlets.length > 0) {
            list = data.outlets.map((o: any) => ({
              id: o.id,
              name: o.name,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load outlets from API, using defaults", err);
      }

      if (list.length === 0) {
        // Use static mock fallback
        list = MOCK_OUTLETS[activeOrgId] || MOCK_OUTLETS["system"];
      }

      setOutlets(list);
      if (list.length > 0) {
        setActiveOutletId(list[0].id);
      } else {
        setActiveOutletId("");
      }
      setIsOutletsLoading(false);
    }

    loadOutlets();
  }, [activeOrgId]);

  // Click outside handlers
  useEffect(() => {
    if (!orgDropdownOpen) return;
    const handleOutsideClick = () => setOrgDropdownOpen(false);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [orgDropdownOpen]);

  useEffect(() => {
    if (!outletDropdownOpen) return;
    const handleOutsideClick = () => setOutletDropdownOpen(false);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [outletDropdownOpen]);

  const activeOrgName = useMemo(() => {
    return organizations.find((o) => o.id === activeOrgId)?.name ?? "Select Organization";
  }, [activeOrgId, organizations]);

  const activeOutletName = useMemo(() => {
    return outlets.find((o) => o.id === activeOutletId)?.name ?? "Select Outlet";
  }, [activeOutletId, outlets]);

  // Roles computed list mapping the states
  const roles = useMemo(() => {
    const rawRoles = getRolesForOrg(activeOrgId, activeOrgName);
    return rawRoles.map((r) => ({
      ...r,
      isActive: roleStatusMap[r.id] !== undefined ? roleStatusMap[r.id] : r.isActive,
    }));
  }, [activeOrgId, activeOrgName, roleStatusMap]);

  const handleOrgChange = (id: string) => {
    setActiveOrgId(id);
    setCurrentPage(1);
    setExpandedRole(null);
    setOrgDropdownOpen(false);
  };

  const handleOutletChange = (id: string) => {
    setActiveOutletId(id);
    setCurrentPage(1);
    setExpandedRole(null);
    setOutletDropdownOpen(false);
  };

  const handleToggleActive = (roleId: string) => {
    setRoleStatusMap((prev) => {
      const currentRole = roles.find((r) => r.id === roleId);
      const currentState = currentRole ? currentRole.isActive : false;
      const nextState = !currentState;
      showToast(`Role "${currentRole?.name}" status updated to ${nextState ? "Active" : "Suspended"}`);
      return {
        ...prev,
        [roleId]: nextState,
      };
    });
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Helper to fetch user counts for role in selected outlet
  const getRoleUserCount = (roleName: string) => {
    if (!activeOutletId) return 0;
    if (MOCK_OUTLET_USER_COUNTS[activeOutletId]) {
      return MOCK_OUTLET_USER_COUNTS[activeOutletId][roleName] ?? 0;
    }
    // Hash-based deterministic number for dynamically loaded db outlets
    let hash = 0;
    const str = roleName + activeOutletId;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 10) + 1; // 1 to 10
  };

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const q = search.toLowerCase();
      const matchesSearch =
        role.name.toLowerCase().includes(q) ||
        role.code.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q);

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

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = roles.length;
    const active = roles.filter((r) => r.isActive).length;
    const inactive = roles.filter((r) => !r.isActive).length;
    const system = roles.filter((r) => r.type === "system").length;
    const custom = roles.filter((r) => r.type === "custom").length;

    const filteredTotal = filteredRoles.length;
    const filteredActive = filteredRoles.filter((r) => r.isActive).length;
    const filteredInactive = filteredRoles.filter((r) => !r.isActive).length;
    const filteredSystem = filteredRoles.filter((r) => r.type === "system").length;
    const filteredCustom = filteredRoles.filter((r) => r.type === "custom").length;

    const hasFilters = search.trim() !== "" || statusFilter !== "ALL";

    return {
      total: hasFilters ? filteredTotal : total,
      active: hasFilters ? filteredActive : active,
      inactive: hasFilters ? filteredInactive : inactive,
      system: hasFilters ? filteredSystem : system,
      custom: hasFilters ? filteredCustom : custom,
      hasFilters,
    };
  }, [roles, filteredRoles, search, statusFilter]);

  // Pagination
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
    <div className="flex flex-col gap-6 p-4 sm:p-0 select-none">
      {/* Header Banner */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Superadmin Roles</h1>

        </div>

        {/* Dynamic Filters Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Organization Picker Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setOrgDropdownOpen((prev) => !prev);
                setOutletDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border bg-white text-emerald-700 border-white shadow-sm transition-colors hover:bg-emerald-50"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="max-w-[120px] truncate">{activeOrgName}</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${orgDropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {orgDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Organization
                  </p>
                </div>
                <div className="py-1 max-h-60 overflow-y-auto">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgChange(org.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${activeOrgId === org.id
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${activeOrgId === org.id ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                      />
                      {org.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Outlet Picker Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setOutletDropdownOpen((prev) => !prev);
                setOrgDropdownOpen(false);
              }}
              disabled={isOutletsLoading || outlets.length === 0}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border bg-white text-emerald-700 border-white shadow-sm transition-colors hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                {isOutletsLoading ? (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                ) : (
                  <Store className="w-4 h-4 shrink-0" />
                )}
                <span className="max-w-[120px] truncate">{activeOutletName}</span>
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
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: stats.hasFilters ? "Filtered Roles" : "Total Roles",
            value: stats.total,
            border: "border-l-slate-400",
            iconBg: "bg-slate-50 text-slate-600",
            icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6" />,
          },
          {
            label: stats.hasFilters ? "Filtered Active" : "Active Roles",
            value: stats.active,
            border: "border-l-emerald-500",
            iconBg: "bg-emerald-50 text-emerald-600",
            icon: <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />,
          },
          {
            label: stats.hasFilters ? "Filtered Suspended" : "Suspended",
            value: stats.inactive,
            border: "border-l-rose-500",
            iconBg: "bg-rose-50 text-rose-600",
            icon: <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />,
          },
          {
            label: stats.hasFilters ? "Filtered System" : "System Templates",
            value: stats.system,
            border: "border-l-blue-500",
            iconBg: "bg-blue-50 text-blue-600",
            icon: <Settings2 className="h-5 w-5 sm:h-6 sm:w-6" />,
          },
          {
            label: stats.hasFilters ? "Filtered Custom" : "Custom Roles",
            value: stats.custom,
            border: "border-l-amber-500",
            iconBg: "bg-amber-50 text-amber-600",
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

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search role name, description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>


      </div>

      {/* Tabular Roles Table */}
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
                  <th className="py-3.5 px-6">Users in Outlet</th>
                  <th className="py-3.5 px-6 text-center">Status Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRoles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-sm text-slate-400">
                      No roles match your search or filter configuration.
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
                          onClick={() => handleToggleExpand(role.id)}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-6 font-semibold text-slate-800">
                            {role.name}
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{role.orgName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-700 font-mono text-xs">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{outletUsersCount} assigned</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(role.id)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${role.isActive ? "bg-emerald-600" : "bg-slate-200"
                                }`}
                              title={role.isActive ? "Click to Suspend" : "Click to Activate"}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${role.isActive ? "translate-x-5" : "translate-x-0"
                                  }`}
                              />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Detail Panel */}
                        {isExpanded && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={4} className="px-6 py-5">
                              <div className="animate-in fade-in duration-200">
                                {/* Permission Privilege Catalog */}
                                <div className="w-full min-w-0">
                                  <div className="flex items-center gap-2 mb-4">
                                    <Shield className="w-4 h-4 text-emerald-600" />
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                      Permission Privilege Catalog (Read-Only)
                                    </h3>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(MODULE_GROUPS).map(([moduleKey, modGroup]) => (
                                      <div key={moduleKey} className="bg-white p-4 rounded-xl border border-slate-200/50 shadow-xs">
                                        <h4 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 capitalize flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
        )}

        {/* Pagination Controls */}
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

      {/* Success Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-800/80 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
