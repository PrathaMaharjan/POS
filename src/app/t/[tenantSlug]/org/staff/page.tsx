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
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
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
  "Cashier",
  "Kitchen Crew",
  "Waiter",
];

const BRANCH_OPTIONS = [
  "Kathmandu Main",
  "Lalitpur Hub",
  "Pokhara Lakeside",
  "Bhaktapur Square",
];

const ITEMS_PER_PAGE = 8;

export default function OrgStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(SEED_STAFF);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    role: ROLE_OPTIONS[0],
    branch: BRANCH_OPTIONS[0],
    email: "",
    phone: "",
    password: "",
  });

  const totalStaff = staff.length;
  const totalManagers = staff.filter((s) => s.role === "Branch Manager").length;
  const activeStaff = staff.filter((s) => s.status === "active").length;

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase());
    
    const matchesBranch = 
      selectedBranchFilter === "all" || member.branch === selectedBranchFilter;

    return matchesSearch && matchesBranch;
  });

  const totalItems = filteredStaff.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

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
    setShowPassword(false);
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
      setCurrentPage(1);
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
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Organization Directory</h1>
      </div>

      {/* Top Status Dashboards */}
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

    
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center max-w-2xl">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by identity or role..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="relative w-full sm:w-52">
            <select
              value={selectedBranchFilter}
              onChange={(e) => {
                setSelectedBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
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

      
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
          <div className="text-sm text-slate-500"></div>
          <div className="flex items-center gap-6">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page {activePage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={activePage === 1}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={activePage === totalPages}
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
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" 
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
          >

            <div className="relative bg-emerald-600 px-8 py-6 text-white flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center  text-white">
                  <UserPlus className="h-6 w-6" />
                </div>
              <h2 className="text-xl font-bold tracking-tight text-center">
                {editingMember ? "Edit Staff Member" : "Add New Staff Member"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>


            <div className="p-8">
           
              <div className="flex flex-col gap-5">
          
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500">Full Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200/80 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>

              
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-500">Role Classification</label>
                    <div className="relative">
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/30 px-4 py-3 pr-10 text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
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
                        value={form.branch}
                        onChange={(e) => setForm({ ...form, branch: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/30 px-4 py-3 pr-10 text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      >
                        {BRANCH_OPTIONS.map((branch) => (
                          <option key={branch} value={branch}>{branch}</option>
                        ))}
                      </select>
                      <MapPin className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Row 4 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Enter you email"
                      className="w-full rounded-xl border border-slate-200/80 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Row 5 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="9XXXXXXXXX"
                      className="w-full rounded-xl border border-slate-200/80 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Row 6 (Conditional) */}
                {!editingMember && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-500">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200/80 py-3 pl-10 pr-12 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
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

             
              <button
                type="button"
                onClick={handleSaveStaff}
                className="mt-8 w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/10 transition-all hover:bg-emerald-700 active:scale-[0.99]"
              >
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}