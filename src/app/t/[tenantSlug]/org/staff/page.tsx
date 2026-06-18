"use client";

import { useState } from "react";
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
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  level: "manager" | "staff";
  branch: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
}

const SEED_STAFF: StaffMember[] = [
  {
    id: "1",
    name: "Kang Roy",
    role: "Branch Manager",
    level: "manager",
    branch: "Kathmandu Main",
    email: "kang.roy@demo-restaurant.com",
    phone: "9810000001",
    status: "active",
  },
  {
    id: "2",
    name: "Aisha Karki",
    role: "Floor Supervisor",
    level: "staff",
    branch: "Lalitpur Hub",
    email: "aisha.karki@demo-restaurant.com",
    phone: "9810000002",
    status: "active",
  },
  {
    id: "3",
    name: "Prakash Thapa",
    role: "Cashier / POS Operator",
    level: "staff",
    branch: "Pokhara Lakeside",
    email: "prakash.thapa@demo-restaurant.com",
    phone: "9810000003",
    status: "inactive",
  },
];

const ROLE_OPTIONS = [
  "Branch Manager",
  "Cashier / POS Operator",
  "Floor Supervisor",
  "Kitchen Staff",
  "Inventory Manager",
];

const BRANCH_OPTIONS = [
  "Kathmandu Main",
  "Lalitpur Hub",
  "Pokhara Lakeside",
  "Bhaktapur Square",
];

export default function OrgStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(SEED_STAFF);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("all");

  const [form, setForm] = useState({
    name: "",
    role: ROLE_OPTIONS[0],
    branch: BRANCH_OPTIONS[0],
    email: "",
    phone: "",
    password: "",
  });

  // Dynamic Calculations
  const totalStaff = staff.length;
  const totalManagers = staff.filter((s) => s.role === "Branch Manager").length;
  const activeStaff = staff.filter((s) => s.status === "active").length;

  // Search and Branch Filter Matrix
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase());
    
    const matchesBranch = 
      selectedBranchFilter === "all" || member.branch === selectedBranchFilter;

    return matchesSearch && matchesBranch;
  });

  function resetForm() {
    setForm({
      name: "",
      role: ROLE_OPTIONS[0],
      branch: BRANCH_OPTIONS[0],
      email: "",
      phone: "",
      password: "",
    });
    setEditingMember(null);
  }

  function handleOpenEdit(member: StaffMember) {
    setEditingMember(member);
    setForm({
      name: member.name,
      role: member.role,
      branch: member.branch,
      email: member.email,
      phone: member.phone,
      password: "••••••••",
    });
    setIsModalOpen(true);
  }

  function handleSaveStaff() {
    if (!form.name || !form.email) return;

    if (editingMember) {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === editingMember.id
            ? {
                ...s,
                name: form.name,
                role: form.role,
                level: form.role === "Branch Manager" ? "manager" : "staff",
                branch: form.branch,
                email: form.email,
                phone: form.phone,
              }
            : s
        )
      );
    } else {
      if (!form.password) return;
      const newMember: StaffMember = {
        id: crypto.randomUUID(),
        name: form.name,
        role: form.role,
        level: form.role === "Branch Manager" ? "manager" : "staff",
        branch: form.branch,
        email: form.email,
        phone: form.phone,
        status: "active",
      };
      setStaff((prev) => [newMember, ...prev]);
    }

    resetForm();
    setIsModalOpen(false);
  }

  function handleDeleteStaff(id: string) {
    if (confirm("Are you sure you want to remove this user from the organization?")) {
      setStaff((prev) => prev.filter((member) => member.id !== id));
    }
  }

  function toggleStatus(id: string) {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s
      )
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Full-Width Green Header (Matched perfectly with Outlets page layout) */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Organization Directory</h1>
      </div>

      {/* Corporate Structure Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Directory</p>
            <p className="text-xl font-semibold text-slate-800">{totalStaff}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Branch Managers</p>
            <p className="text-xl font-semibold text-slate-800">{totalManagers}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Operators</p>
            <p className="text-xl font-semibold text-slate-800">{activeStaff}</p>
          </div>
        </div>
      </div>

      {/* Utility Filtering & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center max-w-2xl">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by identity or role..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="relative w-full sm:w-52">
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Branches</option>
              {BRANCH_OPTIONS.map((branch) => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-98 self-start sm:self-center"
        >
          <UserPlus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {/* Table Interface */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Name / Verification</th>
                <th className="py-3 px-4">Role Matrix</th>
                <th className="py-3 px-4">Assigned Branch</th>
                <th className="py-3 px-4">Contact Gateway</th>
                <th className="py-3 px-4">System Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold border ${
                        member.role === "Branch Manager" 
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
                      onClick={() => toggleStatus(member.id)}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${
                        member.status === "active"
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
                        title="Modify Profile Matrix"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Revoke Credentials"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    No directory entities matching selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-slate-100">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {editingMember ? "Modify Organizational Identity" : "Provision Corporate Account"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Configure operational roles, operational branches, and access profiles.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Legal Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., John Doe"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Functional Classification</label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <Shield className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Branch Allocation</label>
                <div className="relative">
                  <select
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {BRANCH_OPTIONS.map((branch) => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                  <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Enterprise Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Secure Telecom Contact</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {!editingMember && (
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">System Entry Code (Password)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                {editingMember ? "Save Credentials Matrix" : "Finalize Provisioning"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}