"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle,
  XCircle,
  Search,
  X,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Briefcase,
  Globe,
  Plus,
} from "lucide-react";

// Types matching organizations structure
type OrgStatus = "active" | "suspended" | "trial";
type SubscriptionPlan = "Basic" | "Pro" | "Enterprise";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoColor: string; // for dynamic visual avatars
  status: OrgStatus;
  plan: SubscriptionPlan;
  email: string;
  phone: string;
  address: string;
  joinedDate: string;
}

const ITEMS_PER_PAGE = 8;

const BRAND_COLORS = [
  "bg-emerald-600 text-white",
  "bg-teal-600 text-white",
  "bg-cyan-600 text-white",
  "bg-sky-600 text-white",
  "bg-blue-600 text-white",
  "bg-indigo-600 text-white",
  "bg-purple-600 text-white",
  "bg-fuchsia-600 text-white",
  "bg-pink-600 text-white",
  "bg-rose-600 text-white",
  "bg-orange-600 text-white",
  "bg-amber-600 text-white",
];

const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: "1",
    name: "Kathmandu Bakers",
    slug: "kathmandu-bakers",
    logoColor: "bg-emerald-600 text-white",
    status: "active",
    plan: "Pro",
    email: "contact@ktmbakers.com",
    phone: "+977 1-4412345",
    address: "New Baneshwor, Kathmandu",
    joinedDate: "2026-01-15",
  },
  {
    id: "2",
    name: "Himalayan Coffee Co.",
    slug: "himalayan-coffee",
    logoColor: "bg-amber-600 text-white",
    status: "active",
    plan: "Enterprise",
    email: "info@himalayancoffee.com",
    phone: "+977 1-5543210",
    address: "Jhamsikhel, Lalitpur",
    joinedDate: "2025-11-02",
  },
  {
    id: "3",
    name: "Burger House & Fried Chicken",
    slug: "burger-house",
    logoColor: "bg-rose-600 text-white",
    status: "active",
    plan: "Basic",
    email: "admin@burgerhouse.com",
    phone: "+977 1-4228899",
    address: "Putalisadak, Kathmandu",
    joinedDate: "2026-03-10",
  },
  {
    id: "4",
    name: "Taco Fiesta",
    slug: "taco-fiesta",
    logoColor: "bg-indigo-600 text-white",
    status: "trial",
    plan: "Pro",
    email: "hello@tacofiesta.com",
    phone: "+977 9801234567",
    address: "Bakhundole, Lalitpur",
    joinedDate: "2026-06-20",
  },
  {
    id: "5",
    name: "Sushi Palace",
    slug: "sushi-palace",
    logoColor: "bg-purple-600 text-white",
    status: "suspended",
    plan: "Basic",
    email: "billing@sushipalace.com",
    phone: "+977 1-4001122",
    address: "Durbar Marg, Kathmandu",
    joinedDate: "2025-08-14",
  }
];

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGANIZATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    plan: "Basic" as SubscriptionPlan,
    status: "active" as OrgStatus,
  });

  // Simulated API fetch delay
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter((o) => o.status === "active").length;
  const suspendedOrgs = organizations.filter((o) => o.status === "suspended").length;

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase()) ||
      org.phone.includes(search)
  );

  const totalItems = filteredOrgs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginatedOrgs = filteredOrgs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function resetForm() {
    setForm({
      name: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      plan: "Basic",
      status: "active",
    });
    setEditingOrg(null);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function handleOpenEdit(org: Organization) {
    setEditingOrg(org);
    setForm({
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      address: org.address,
      plan: org.plan,
      status: org.status,
    });
    setIsModalOpen(true);
  }

  async function handleSaveOrg() {
    if (!form.name || !form.slug || !form.email) return;
    setIsSaving(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (editingOrg) {
        setOrganizations((prev) =>
          prev.map((o) =>
            o.id === editingOrg.id
              ? {
                  ...o,
                  name: form.name,
                  slug: form.slug,
                  email: form.email,
                  phone: form.phone,
                  address: form.address,
                  plan: form.plan,
                  status: form.status,
                }
              : o
          )
        );
      } else {
        const randomColor = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
        const newOrg: Organization = {
          id: Date.now().toString(),
          name: form.name,
          slug: form.slug.toLowerCase().replace(/\s+/g, "-"),
          logoColor: randomColor,
          status: form.status,
          plan: form.plan,
          email: form.email,
          phone: form.phone,
          address: form.address,
          joinedDate: new Date().toISOString().split("T")[0],
        };
        setOrganizations((prev) => [newOrg, ...prev]);
        setCurrentPage(1);
      }

      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save organization:", err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteOrg(id: string) {
    setIsDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setOrganizations((prev) => prev.filter((o) => o.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete organization:", err);
    } finally {
      setIsDeleting(false);
    }
  }

  function toggleStatus(id: string) {
    setOrganizations((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const nextStatusMap: Record<OrgStatus, OrgStatus> = {
            active: "suspended",
            suspended: "trial",
            trial: "active",
          };
          return { ...o, status: nextStatusMap[o.status] };
        }
        return o;
      })
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-xs text-emerald-100 mt-1">Manage global enterprise tenants and system organizations</p>
        </div>
        <Building2 className="h-8 w-8 text-emerald-100 opacity-85 shrink-0" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-l-4 border-l-slate-400 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tenants</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{totalOrgs}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <Building2 className="h-5 w-5 sm:h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-[#18a172] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Tenants</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{activeOrgs}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#0f6b4a]">
            <CheckCircle className="h-5 w-5 sm:h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Suspended</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{suspendedOrgs}</p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <XCircle className="h-5 w-5 sm:h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search organizations or contact..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-98"
        >
          <Plus className="h-4 w-4" />
          Add Organization
        </button>
      </div>

      {/* Grid List Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Loading tenants...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs shadow-sm border border-black/5 ${org.logoColor}`}
                          >
                            {getInitials(org.name)}
                          </div>
                          <span className="font-semibold text-slate-900 break-normal">{org.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-slate-600 font-mono text-xs font-medium bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/40 w-fit">
                          <Globe className="h-3 w-3 text-slate-400" />
                          <span>{org.slug}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px] font-medium text-slate-700">{org.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-slate-500 font-semibold">{org.phone || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs max-w-[180px]">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{org.address || "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                            org.plan === "Enterprise"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : org.plan === "Pro"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {org.plan}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(org.id)}
                          title="Click to toggle status"
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${
                            org.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : org.status === "suspended"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                              : "bg-amber-50 text-amber-700 border border-amber-200/50"
                          }`}
                        >
                          <span
                            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                              org.status === "active"
                                ? "bg-emerald-600"
                                : org.status === "suspended"
                                ? "bg-rose-600"
                                : "bg-amber-500"
                            }`}
                          />
                          {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(org)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="Edit Tenant"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(org.id)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Remove Tenant"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedOrgs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                        No organizations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end gap-6 border-t border-slate-100 bg-white px-6 py-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
          </>
        )}
      </div>

      {/* Add / Edit Tenant Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-sm"
          onClick={() => !isSaving && setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-t-2xl sm:rounded-xl bg-white shadow-xl border border-slate-100 overflow-y-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="relative flex flex-col items-center justify-center bg-emerald-600 p-5 text-white shrink-0">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Building2 className="h-6 w-6 text-white mb-0.5" />
                <h2 className="text-lg font-semibold text-white">
                  {editingOrg ? "Modify Organization Details" : "Register New Organization"}
                </h2>
              </div>
              <button
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-5 p-5 md:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Organization Name
                  </label>
                  <input
                    disabled={isSaving}
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name
                        .toLowerCase()
                        .replace(/[^a-z0-9 ]/g, "")
                        .replace(/\s+/g, "-");
                      setForm({ ...form, name, slug: editingOrg ? form.slug : slug });
                    }}
                    placeholder="e.g. Burger House"
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Subdomain / Slug
                  </label>
                  <input
                    disabled={isSaving || !!editingOrg}
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="e.g. burger-house"
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    disabled={isSaving}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. contact@domain.com"
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Contact Phone Number
                  </label>
                  <input
                    disabled={isSaving}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. +977 1-4XXXXXX"
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Headquarters Location
                </label>
                <input
                  disabled={isSaving}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. Kathmandu, Nepal"
                  className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Subscription Tier Plan
                  </label>
                  <select
                    disabled={isSaving}
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value as SubscriptionPlan })}
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  >
                    <option value="Basic">Basic Plan</option>
                    <option value="Pro">Professional Plan</option>
                    <option value="Enterprise">Enterprise Elite</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    System Account Status
                  </label>
                  <select
                    disabled={isSaving}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as OrgStatus })}
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  >
                    <option value="active">Active System</option>
                    <option value="trial">Trial Period</option>
                    <option value="suspended">Suspended Session</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 active:scale-98 disabled:opacity-60 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveOrg}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:scale-98 disabled:opacity-60 transition-all"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                {editingOrg ? "Save Changes" : "Confirm Register"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => !isDeleting && setDeleteConfirmId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Remove Organization</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete this tenant system? This action is permanent and will clear all linked
                  data indices.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 active:scale-98 transition-all disabled:opacity-60"
              >
                Keep Active
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteOrg(deleteConfirmId)}
                className="flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 active:scale-98 transition-all disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}