"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  Lock,
  Shield,
  X,
  Pencil,
  Trash2,
  Users,
  CheckCircle,
  Building,
  MapPin,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Store,
  ChevronDown,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  level: "manager" | "staff";
  branch: string;
  outletId: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
}

const ROLE_OPTIONS = [
  "Branch Manager",
  "Cashier",
  "Kitchen Crew",
  "Waiter",
];

const ITEMS_PER_PAGE = 8;

export default function OrgStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  // ── Outlet picker state ───────────────────────────────────────────────────
  const [activeOutletId, setActiveOutletId] = useState<string>("");
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);

  const activeOutlet = outlets.find((o) => o.id === activeOutletId);

  const [form, setForm] = useState({
    name: "",
    role: ROLE_OPTIONS[0],
    branchId: "",
    email: "",
    phone: "",
    password: "",
  });

  async function fetchAllData(outletId: string) {
    if (!outletId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/staff?outletId=${outletId}&limit=100`);
      const outlet = outlets.find((o) => o.id === outletId);
      const mapped: StaffMember[] = (res.data.staff ?? []).map((s: any) => ({
        id: s.userId,
        name: s.name,
        role: s.role === "Manager" ? "Branch Manager" : s.role,
        level: s.role === "Manager" ? ("manager" as const) : ("staff" as const),
        branch: outlet?.name ?? "",
        outletId: outletId,
        email: s.email,
        phone: s.phone || "",
        status: s.isActive ? ("active" as const) : ("inactive" as const),
      }));
      setStaff(mapped);
    } catch (err: any) {
      console.error("Failed to fetch staff:", err);
      alert(err.response?.data?.error ?? "Failed to load staff data");
    } finally {
      setIsLoading(false);
    }
  }

  // 1. Fetch outlets on mount, then load staff for the active outlet
  useEffect(() => {
    async function initOutlets() {
      try {
        const resOutlets = await api.get("/outlets");
        const fetchedOutlets = resOutlets.data.outlets ?? [];
        setOutlets(fetchedOutlets);

        if (fetchedOutlets.length > 0) {
          const stored = localStorage.getItem("activeOutletId");
          const initialId =
            stored && fetchedOutlets.some((o: any) => o.id === stored)
              ? stored
              : fetchedOutlets[0].id;
          setActiveOutletId(initialId);
        }
      } catch (err: any) {
        console.error("Failed to fetch outlets:", err);
        alert(err.response?.data?.error ?? "Failed to load outlets");
      }
    }
    initOutlets();
  }, []);

  // 2. Fetch staff whenever activeOutletId changes
  useEffect(() => {
    if (activeOutletId && outlets.length > 0) {
      fetchAllData(activeOutletId);
    }
  }, [activeOutletId, outlets]);

  // 3. Set default form branchId
  useEffect(() => {
    if (outlets.length > 0 && !form.branchId) {
      setForm((prev) => ({ ...prev, branchId: outlets[0].id }));
    }
  }, [outlets, form.branchId]);

  // 4. Close dropdown on outside click
  useEffect(() => {
    if (!outletDropdownOpen) return;
    const handler = () => setOutletDropdownOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [outletDropdownOpen]);

  const handleOutletChange = (id: string) => {
    localStorage.setItem("activeOutletId", id);
    setActiveOutletId(id);
    setCurrentPage(1);
    setOutletDropdownOpen(false);
  };

  const totalStaff = staff.length;
  const totalManagers = staff.filter((s) => s.role === "Branch Manager" || s.role === "Manager").length;
  const activeStaff = staff.filter((s) => s.status === "active").length;

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      selectedRoleFilter === "all" || member.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const totalItems = filteredStaff.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function resetForm() {
    setForm({
      name: "",
      role: ROLE_OPTIONS[0],
      branchId: activeOutletId || outlets[0]?.id || "",
      email: "",
      phone: "",
      password: "",
    });
    setEditingMember(null);
    setShowPassword(false);
  }

  function handleOpenEdit(member: StaffMember) {
    setEditingMember(member);
    setForm({
      name: member.name,
      role: member.role,
      branchId: member.outletId,
      email: member.email,
      phone: member.phone,
      password: "••••••••",
    });
    setIsModalOpen(true);
  }

  async function handleSaveStaff() {
    if (!form.name || !form.email) return;
    setIsSaving(true);

    try {
      if (editingMember) {
        const infoChanged =
          form.name !== editingMember.name ||
          form.email !== editingMember.email ||
          (form.phone || "") !== (editingMember.phone || "");

        const apiRole = form.role === "Branch Manager" ? "Manager" : form.role;
        const originalApiRole = editingMember.role === "Branch Manager" ? "Manager" : editingMember.role;
        const roleChanged = apiRole !== originalApiRole;
        const errors: string[] = [];

        if (infoChanged) {
          try {
            await api.patch(`/staff/${editingMember.id}/info`, {
              name: form.name,
              email: form.email,
              phone: form.phone || undefined,
              outletId: editingMember.outletId,
            });
          } catch (err: any) {
            errors.push(err.response?.data?.error ?? "Failed to update profile details.");
          }
        }

        if (roleChanged) {
          try {
            await api.patch(`/staff/${editingMember.id}`, { role: apiRole });
          } catch (err: any) {
            errors.push(err.response?.data?.error ?? "Failed to update role.");
          }
        }

        if (errors.length > 0) throw new Error(errors.join("\n"));
        await fetchAllData(activeOutletId);
      } else {
        if (!form.password) return;
        const apiRole = form.role === "Branch Manager" ? "Manager" : form.role;
        await api.post("/staff", {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          role: apiRole,
          password: form.password,
          outletId: form.branchId || activeOutletId,
        });
        await fetchAllData(activeOutletId);
        setCurrentPage(1);
      }

      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to save staff member:", err);
      const responseData = err.response?.data;
      let errMsg = "Failed to save staff member. Please try again.";
      if (responseData) {
        if (typeof responseData.error === "string") {
          errMsg = responseData.error;
        } else if (responseData.error && typeof responseData.error === "object") {
          const zodError = responseData.error;
          if (zodError.fieldErrors) {
            errMsg = Object.entries(zodError.fieldErrors)
              .map(([field, messages]: any) => `${field}: ${messages.join(", ")}`)
              .join("\n");
          } else {
            errMsg = JSON.stringify(responseData.error);
          }
        }
      }
      alert(errMsg);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteStaff(member: StaffMember) {
    if (confirm(`Are you sure you want to remove ${member.name} from the organization?`)) {
      try {
        setIsLoading(true);
        await api.delete(`/staff/${member.id}`, {
          params: { outletId: member.outletId },
        });
        await fetchAllData(activeOutletId);
      } catch (err: any) {
        console.error("Failed to delete staff member:", err);
        alert(err.response?.data?.error ?? "Failed to delete staff member");
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function toggleStatus(member: StaffMember) {
    try {
      const newStatus = member.status === "active" ? "inactive" : "active";
      await api.patch(`/staff/${member.id}/status`, {
        isActive: newStatus === "active",
        outletId: member.outletId,
      });
      await fetchAllData(activeOutletId);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(err.response?.data?.error ?? "Failed to update status");
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Organization Directory</h1>

        {/* Outlet picker */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOutletDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border bg-white text-emerald-700 border-white shadow-sm transition-colors"
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
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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
                    <span className={`w-2 h-2 rounded-full shrink-0 ${activeOutletId === outlet.id ? "bg-emerald-500" : "bg-slate-200"}`} />
                    {outlet.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-l-4 border-l-slate-400 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Directory</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{totalStaff}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-indigo-500 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Branch Managers</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{totalManagers}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-[#18a172] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Operators</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{activeStaff}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#0f6b4a]">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center max-w-3xl">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by identity or role..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="relative w-full sm:w-52">
            <select
              value={selectedRoleFilter}
              onChange={(e) => { setSelectedRoleFilter(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Roles</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-98 self-start sm:self-center"
        >
          <UserPlus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Loading organization directory...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Name / Verification</th>
                    <th className="py-3 px-4">Role Matrix</th>
                    <th className="py-3 px-4">Assigned Branch</th>
                    <th className="py-3 px-4">Contact Gateway</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold border ${member.role === "Branch Manager"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                            {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <span className="font-medium text-slate-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{member.role}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-sm">{member.branch}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        <div className="flex flex-col">
                          <span>{member.email}</span>
                          <span className="text-xs text-slate-400 mt-0.5">{member.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(member)}
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${member.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                        >
                          <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${member.status === "active" ? "bg-emerald-600" : "bg-slate-400"}`} />
                          {member.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(member)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedStaff.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                        No directory entities matching selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
              <div className="text-sm text-slate-500" />
              <div className="flex items-center gap-6">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Page {activePage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={activePage === 1}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={activePage === totalPages}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-sm"
          onClick={() => !isSaving && setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-y-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col"
          >
            <div className="relative bg-emerald-600 px-6 py-5 text-white flex flex-col items-center justify-center shrink-0">
              <div className="flex h-10 w-10 items-center justify-center text-white mb-1">
                <UserPlus className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-center">
                {editingMember ? "Edit Staff Member" : "Add New Staff Member"}
              </h2>
              <button
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500">Full Name</label>
                  <input
                    disabled={isSaving}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200/80 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-500">Role Classification</label>
                    <div className="relative">
                      <select
                        disabled={isSaving}
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/30 px-4 py-3 pr-10 text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <Shield className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-500">Branch Allocation</label>
                    <div className="relative">
                      <select
                        disabled={isSaving || !!editingMember}
                        value={form.branchId}
                        onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/30 px-4 py-3 pr-10 text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {outlets.map((outlet) => (
                          <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                        ))}
                      </select>
                      <MapPin className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      disabled={isSaving}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Enter your email"
                      className="w-full rounded-xl border border-slate-200/80 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      disabled={isSaving}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="9XXXXXXXXX"
                      className="w-full rounded-xl border border-slate-200/80 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {!editingMember && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-500">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        disabled={isSaving}
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200/80 py-3 pl-10 pr-12 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6 shrink-0 pb-6 sm:pb-0">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveStaff}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/10 transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? "Saving..." : editingMember ? "Save Changes" : "Add Staff"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}