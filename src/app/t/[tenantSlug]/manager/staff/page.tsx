"use client";

import { useState, useEffect, useCallback } from "react";
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
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import api from '@/lib/api';


interface StaffMember {
  userId: string;
  name: string;
  role: string;
  email: string;
  phone: string | null;
  isActive: boolean;
}

const ROLE_OPTIONS = ["Cashier", "Waiter", "Kitchen Crew"];

const ITEMS_PER_PAGE = 8;



export default function StaffPage() {
  
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStaff, setTotalStaff] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("All");


  const [form, setForm] = useState({
    name: "",
    role: ROLE_OPTIONS[0],
    email: "",
    phone: "",
    password: "",
  });

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get("/staff", {
        params: { page: currentPage, limit: ITEMS_PER_PAGE },
      });
      const data = res.data;
      setStaff(data.staff ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotalStaff(data.pagination?.total ?? 0);
    } catch (err: any) {
      setErrorMsg(
        typeof err?.response?.data?.error === "string"
          ? err.response.data.error
          : "Failed to load staff."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

const filteredStaff = staff.filter((member) => {
  const matchesSearch =
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.role.toLowerCase().includes(search.toLowerCase());
  const matchesRole = roleFilter === "All" || member.role === roleFilter;
  return matchesSearch && matchesRole;
});

  const activeStaff = staff.filter((s) => s.isActive).length;
  const inactiveStaff = staff.filter((s) => !s.isActive).length;

  function resetForm() {
    setForm({ name: "", role: ROLE_OPTIONS[0], email: "", phone: "", password: "" });
    setEditingMember(null);
    setErrorMsg(null);
  }

  function handleOpenEdit(member: StaffMember) {
    setEditingMember(member);
    setForm({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone ?? "",
      password: "••••••••",
    });
    setIsModalOpen(true);
  }

  async function handleSaveStaff() {
    setErrorMsg(null);

    if (editingMember) {
      if (!form.name || !form.email) return;
      setIsSaving(true);

 
      const infoChanged =
        form.name !== editingMember.name ||
        form.email !== editingMember.email ||
        (form.phone || "") !== (editingMember.phone ?? "");
      const roleChanged = form.role !== editingMember.role;

      const errors: string[] = [];

      if (infoChanged) {
        try {
          await api.patch(`/staff/${editingMember.userId}/info`, {
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
          });
        } catch (err: any) {
          errors.push(err?.response?.data?.error ?? "Failed to update profile details.");
        }
      }

      if (roleChanged) {
        try {
          await api.patch(`/staff/${editingMember.userId}`, { role: form.role });
        } catch (err: any) {
          errors.push(err?.response?.data?.error ?? "Failed to update role.");
        }
      }

      await fetchStaff();
      setIsSaving(false);

      if (errors.length > 0) {
        setErrorMsg(errors.join(" "));
        return; 
      }

      resetForm();
      setIsModalOpen(false);
      return;
    }

    if (!form.name || !form.email || !form.password) return;

    try {
      setIsSaving(true);
      await api.post("/staff", {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        password: form.password,
      });
      setCurrentPage(1);
      await fetchStaff();
      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.error?.fieldErrors) {
        const firstField = Object.values(data.error.fieldErrors)[0] as string[] | undefined;
        setErrorMsg(firstField?.[0] ?? "Please check the form for errors.");
      } else {
        setErrorMsg(typeof data?.error === "string" ? data.error : "Failed to create staff member.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteStaff() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/staff/${deleteTarget.userId}`);
      await fetchStaff();
      setDeleteTarget(null);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error ?? "Failed to remove staff member.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function toggleStatus(userId: string, currentlyActive: boolean) {
    try {
      await api.patch(`/staff/${userId}/status`, { isActive: !currentlyActive });
      await fetchStaff();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to update status.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
      </div>

      {/* Top Status Dashboards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Staff</p>
            <p className="text-xl font-semibold text-slate-800">{totalStaff}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active </p>
            <p className="text-xl font-semibold text-slate-800">{activeStaff}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Inactive (this page)</p>
            <p className="text-xl font-semibold text-slate-800">{inactiveStaff}</p>
          </div>
        </div>
      </div>


      <div className="flex items-center justify-between gap-4">
  <div className="flex items-center gap-3">
    {/* Search */}
    <div className="relative w-80">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search staff on this page..."
        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>

    {/* Role Filter */}
    <select
      value={roleFilter}
      onChange={(e) => setRoleFilter(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      <option value="All">All Roles</option>
      {ROLE_OPTIONS.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  </div>

  {/* Add Staff Button */}
  <button
    onClick={() => {
      resetForm();
      setIsModalOpen(true);
    }}
    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
  >
    <UserPlus className="h-4 w-4" />
    Add Staff
  </button>
</div>
       
      

      {errorMsg && !isModalOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}


      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                <>
                  {filteredStaff.map((member) => (
                    <tr key={member.userId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 border border-emerald-100">
                            {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <span className="font-medium text-slate-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{member.role}</td>
                      <td className="py-4 px-4 text-slate-500">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{member.email}</span>
                          <span className="text-xs text-slate-400 mt-0.5 font-mono">{member.phone ?? "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(member.userId, member.isActive)}
                          title="Click to toggle status"
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${
                            member.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${member.isActive ? "bg-emerald-600" : "bg-slate-400"}`} />
                          {member.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="Edit Staff"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(member)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                        No staff members match your search parameters.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <div className="text-sm text-slate-500"></div>

          <div className="flex items-center gap-6">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page {currentPage} of {totalPages}
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
                disabled={currentPage === totalPages}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Next Page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-slate-100 overflow-hidden">

            <div className="relative flex items-center justify-center bg-emerald-600 p-6 text-white">
              <div className="flex h-10 w-10 items-center justify-center text-white">
                <UserPlus className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-white text-center">
                {editingMember ? "Edit Staff Member" : "Add New Staff Member"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-1/2 -translate-y-1/2 rounded-md p-1 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">Role Classification</label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-slate-200/80 bg-slate-50/30 px-3 py-2.5 pr-9 text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <Shield className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9XXXXXXXXX"
                    className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              {!editingMember && (
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-500">Initial Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-6 bg-slate-50/50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStaff}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingMember ? "Save Changes" : "Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Remove Staff Member</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-slate-700">{deleteTarget.name}</span>{" "}
                  from staff? 
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 border-t border-slate-100 p-6 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStaff}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}