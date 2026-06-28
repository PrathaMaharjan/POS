"use client";

import React, { useState, useMemo } from "react";
import {
    Building2,
    Plus,
    Search,
    Edit2,
    Eye,
    Trash2,
    Ban,
    CheckCircle2,
    X,
    Mail,
    Phone,
    MapPin,
    Calendar,
    AlertTriangle,
    Layers,
    Sparkles,
    Check,
    RotateCcw,
    Loader2,
} from "lucide-react";

// Types matching core schema & subscriptions
type OrgStatus = "active" | "suspended" | "trial";
type SubscriptionPlan = "Basic" | "Pro" | "Enterprise";

interface Organization {
    id: string;
    name: string;
    slug: string;
    logoColor: string; // for dynamic aesthetic placeholders
    status: OrgStatus;
    plan: SubscriptionPlan;
    email: string;
    phone: string;
    address: string;
    joinedDate: string;
    outlets: string[];
}

// Initial Mock Data
const INITIAL_ORGANIZATIONS: Organization[] = [
    {
        id: "1",
        name: "Kathmandu Bakers",
        slug: "kathmandu-bakers",
        logoColor: "bg-emerald-500 text-white",
        status: "active",
        plan: "Pro",
        email: "contact@ktmbakers.com",
        phone: "+977 1-4412345",
        address: "New Baneshwor, Kathmandu",
        joinedDate: "2026-01-15",
        outlets: ["Kathmandu Main Branch", "Lalitpur Hub", "Bhaktapur Express"]
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
        outlets: ["Jhamsikhel Roastery", "Thamel Cafe", "Pokhara Lakeside", "Butwal Junction", "Biratnagar Hub"]
    },
    {
        id: "3",
        name: "Burger House & Fried Chicken",
        slug: "burger-house",
        logoColor: "bg-rose-500 text-white",
        status: "active",
        plan: "Basic",
        email: "admin@burgerhouse.com",
        phone: "+977 1-4228899",
        address: "Putalisadak, Kathmandu",
        joinedDate: "2026-03-10",
        outlets: ["Putalisadak Outlet", "Koteshwor Branch"]
    },
    {
        id: "4",
        name: "Taco Fiesta",
        slug: "taco-fiesta",
        logoColor: "bg-indigo-500 text-white",
        status: "trial",
        plan: "Pro",
        email: "hello@tacofiesta.com",
        phone: "+977 9801234567",
        address: "Bakhundole, Lalitpur",
        joinedDate: "2026-06-20",
        outlets: ["Bakhundole Main"]
    },
    {
        id: "5",
        name: "Sushi Palace",
        slug: "sushi-palace",
        logoColor: "bg-purple-500 text-white",
        status: "suspended",
        plan: "Basic",
        email: "billing@sushipalace.com",
        phone: "+977 1-4001122",
        address: "Durbar Marg, Kathmandu",
        joinedDate: "2025-08-14",
        outlets: ["Durbar Marg Store"]
    }
];

// Color palette options for new organizations
const BRAND_COLORS = [
    "bg-emerald-500 text-white",
    "bg-teal-500 text-white",
    "bg-cyan-500 text-white",
    "bg-sky-500 text-white",
    "bg-blue-500 text-white",
    "bg-indigo-500 text-white",
    "bg-purple-500 text-white",
    "bg-fuchsia-500 text-white",
    "bg-pink-500 text-white",
    "bg-rose-500 text-white",
    "bg-orange-500 text-white",
    "bg-amber-600 text-white",
];

interface Toast {
    id: string;
    message: string;
    type: "success" | "info" | "warning";
}

export default function AdminOrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGANIZATIONS);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [planFilter, setPlanFilter] = useState<string>("all");

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Active / Selected organization for Edit/View/Delete
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

    // Form States (for Add & Edit)
    const [formName, setFormName] = useState("");
    const [formSlug, setFormSlug] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formPlan, setFormPlan] = useState<SubscriptionPlan>("Basic");
    const [formStatus, setFormStatus] = useState<OrgStatus>("trial");
    const [formAddress, setFormAddress] = useState("");
    const [formOutletsText, setFormOutletsText] = useState(""); // Comma-separated outlets

    // Toast Notifications State
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Show a toast message helper
    const triggerToast = (message: string, type: "success" | "info" | "warning" = "success") => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Helper to get initials
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    // Open modals
    const handleOpenAdd = () => {
        setFormName("");
        setFormSlug("");
        setFormEmail("");
        setFormPhone("");
        setFormPlan("Basic");
        setFormStatus("trial");
        setFormAddress("");
        setFormOutletsText("");
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (org: Organization) => {
        setSelectedOrg(org);
        setFormName(org.name);
        setFormSlug(org.slug);
        setFormEmail(org.email);
        setFormPhone(org.phone);
        setFormPlan(org.plan);
        setFormStatus(org.status);
        setFormAddress(org.address);
        setFormOutletsText(org.outlets.join(", "));
        setIsEditModalOpen(true);
    };

    const handleOpenView = (org: Organization) => {
        setSelectedOrg(org);
        setIsViewModalOpen(true);
    };

    // CRUD Handlers
    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim() || !formSlug.trim() || !formEmail.trim()) {
            triggerToast("Please fill in Name, Slug, and Admin Email", "warning");
            return;
        }

        // Slug unique validation
        const slugExists = organizations.some((org) => org.slug.toLowerCase() === formSlug.trim().toLowerCase());
        if (slugExists) {
            triggerToast(`Slug "${formSlug.trim()}" is already in use`, "warning");
            return;
        }

        setIsSaving(true);

        const newColor = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
        const newOutlets = formOutletsText
            .split(",")
            .map((o) => o.trim())
            .filter((o) => o !== "");

        const newOrg: Organization = {
            id: Date.now().toString(),
            name: formName.trim(),
            slug: formSlug.trim().toLowerCase().replace(/\s+/g, "-"),
            logoColor: newColor,
            status: formStatus,
            plan: formPlan,
            email: formEmail.trim(),
            phone: formPhone.trim(),
            address: formAddress.trim(),
            joinedDate: new Date().toISOString().split("T")[0],
            outlets: newOutlets.length > 0 ? newOutlets : ["Main Branch"]
        };

        setOrganizations((prev) => [newOrg, ...prev]);
        setIsSaving(false);
        setIsAddModalOpen(false);
        triggerToast(`Organization "${newOrg.name}" created successfully!`, "success");
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrg) return;

        if (!formName.trim() || !formSlug.trim() || !formEmail.trim()) {
            triggerToast("Please fill in Name, Slug, and Admin Email", "warning");
            return;
        }

        // Slug unique validation (excluding itself)
        const slugExists = organizations.some(
            (org) => org.id !== selectedOrg.id && org.slug.toLowerCase() === formSlug.trim().toLowerCase()
        );
        if (slugExists) {
            triggerToast(`Slug "${formSlug.trim()}" is already in use by another organization`, "warning");
            return;
        }

        setIsSaving(true);

        const updatedOutlets = formOutletsText
            .split(",")
            .map((o) => o.trim())
            .filter((o) => o !== "");

        setOrganizations((prev) =>
            prev.map((org) =>
                org.id === selectedOrg.id
                    ? {
                        ...org,
                        name: formName.trim(),
                        slug: formSlug.trim().toLowerCase().replace(/\s+/g, "-"),
                        email: formEmail.trim(),
                        phone: formPhone.trim(),
                        plan: formPlan,
                        status: formStatus,
                        address: formAddress.trim(),
                        outlets: updatedOutlets.length > 0 ? updatedOutlets : ["Main Branch"]
                    }
                    : org
            )
        );

        setIsSaving(false);
        setIsEditModalOpen(false);
        setSelectedOrg(null);
        triggerToast("Organization details updated successfully", "success");
    };

    const handleToggleStatus = (org: Organization) => {
        const nextStatus: OrgStatus = org.status === "active" ? "suspended" : "active";
        setOrganizations((prev) =>
            prev.map((o) => (o.id === org.id ? { ...o, status: nextStatus } : o))
        );
        triggerToast(
            `"${org.name}" has been ${nextStatus === "active" ? "Activated" : "Suspended"}`,
            nextStatus === "active" ? "success" : "info"
        );
    };

    const handleDeleteConfirm = () => {
        if (!deleteConfirmId) return;
        setIsDeleting(true);
        const orgToDelete = organizations.find((o) => o.id === deleteConfirmId);
        if (orgToDelete) {
            setOrganizations((prev) => prev.filter((o) => o.id !== deleteConfirmId));
            triggerToast(`Organization "${orgToDelete.name}" deleted permanently`, "warning");
        }
        setIsDeleting(false);
        setDeleteConfirmId(null);
    };

    // Computations for Stats
    const stats = useMemo(() => {
        const total = organizations.length;
        const active = organizations.filter((o) => o.status === "active").length;
        const trial = organizations.filter((o) => o.status === "trial").length;
        const suspended = organizations.filter((o) => o.status === "suspended").length;

        return { total, active, trial, suspended };
    }, [organizations]);

    // Filtered List
    const filteredOrganizations = useMemo(() => {
        return organizations.filter((org) => {
            const matchesSearch =
                org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.email.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === "all" || org.status === statusFilter;
            const matchesPlan = planFilter === "all" || org.plan === planFilter;

            return matchesSearch && matchesStatus && matchesPlan;
        });
    }, [organizations, searchQuery, statusFilter, planFilter]);

    return (
        <div className="flex flex-col gap-8">
            {/* Toast Notifications */}
            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`flex items-center justify-between p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 bg-white ${t.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : t.type === "warning"
                                ? "border-rose-200 bg-rose-50 text-rose-800"
                                : "border-blue-200 bg-blue-50 text-blue-800"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                            {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                            {t.type === "info" && <Building2 className="w-5 h-5 text-blue-600 shrink-0" />}
                            <span className="text-sm font-medium">{t.message}</span>
                        </div>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-full hover:bg-slate-200/50"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
                <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border-l-4 border-l-indigo-500 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tenants</p>
                        <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{stats.total}</p>
                    </div>
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                </div>

                <div className="rounded-xl border-l-4 border-l-[#18a172] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Operations</p>
                        <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{stats.active}</p>
                    </div>
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#0f6b4a]">
                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                </div>

                <div className="rounded-xl border-l-4 border-l-amber-500 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Trial Workspaces</p>
                        <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{stats.trial}</p>
                    </div>
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                </div>

                <div className="rounded-xl border-l-4 border-l-rose-500 border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Suspended Accounts</p>
                        <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-all">{stats.suspended}</p>
                    </div>
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                        <Ban className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                </div>
            </div>

            {/* Search + Filters + Add */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center max-w-3xl">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, slug, or email..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="relative w-full sm:w-36">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e")`,
                                backgroundPosition: `right 8px center`,
                                backgroundSize: `16px 16px`,
                                backgroundRepeat: `no-repeat`,
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>

                    <div className="relative w-full sm:w-36">
                        <select
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value)}
                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e")`,
                                backgroundPosition: `right 8px center`,
                                backgroundSize: `16px 16px`,
                                backgroundRepeat: `no-repeat`,
                            }}
                        >
                            <option value="all">All Plans</option>
                            <option value="Basic">Basic</option>
                            <option value="Pro">Pro</option>
                            <option value="Enterprise">Enterprise</option>
                        </select>
                    </div>

                    {(searchQuery !== "" || statusFilter !== "all" || planFilter !== "all") && (
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                                setPlanFilter("all");
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                        </button>
                    )}
                </div>

                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-98 self-start sm:self-center"
                >
                    <Plus className="h-4 w-4" />
                    Create Organization
                </button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm font-medium">Loading organizations...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    <th className="py-3 px-4">Organization</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Plan</th>
                                    <th className="py-3 px-4 text-center">Outlets</th>
                                    <th className="py-3 px-4">Joined Date</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrganizations.map((org) => (
                                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold shrink-0 ${org.logoColor}`}>
                                                    {getInitials(org.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="font-medium text-slate-900 block truncate">{org.name}</span>
                                                    <span className="text-xs text-slate-400 font-mono">/{org.slug}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            {org.status === "active" && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                    Active
                                                </span>
                                            )}
                                            {org.status === "trial" && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    Trial
                                                </span>
                                            )}
                                            {org.status === "suspended" && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/50">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                    Suspended
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-4">
                                            {org.plan === "Enterprise" && (
                                                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                                    Enterprise
                                                </span>
                                            )}
                                            {org.plan === "Pro" && (
                                                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    Pro
                                                </span>
                                            )}
                                            {org.plan === "Basic" && (
                                                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                    Basic
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-4 text-center">
                                            <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                {org.outlets.length}
                                            </span>
                                        </td>

                                        <td className="py-4 px-4 text-slate-500 font-mono text-xs">
                                            {org.joinedDate}
                                        </td>

                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenView(org)}
                                                    title="View Details"
                                                    className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(org)}
                                                    title="Edit Organization"
                                                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(org)}
                                                    title={org.status === "active" ? "Suspend Organization" : "Activate Organization"}
                                                    className={`rounded-md p-1.5 transition-colors ${org.status === "active"
                                                            ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                            : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                                                        }`}
                                                >
                                                    {org.status === "active" ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(org.id)}
                                                    title="Delete Organization"
                                                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredOrganizations.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                                            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            No organizations match your search parameters.
                                            {(searchQuery !== "" || statusFilter !== "all" || planFilter !== "all") && (
                                                <button
                                                    onClick={() => {
                                                        setSearchQuery("");
                                                        setStatusFilter("all");
                                                        setPlanFilter("all");
                                                    }}
                                                    className="mt-3 flex items-center gap-1.5 mx-auto bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Reset Filters
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal - VIEW ORGANIZATION DETAILS */}
            {isViewModalOpen && selectedOrg && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg rounded-t-2xl sm:rounded-xl bg-white shadow-xl border border-slate-100 overflow-y-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col"
                    >
                        <div className="relative flex flex-col items-center justify-center bg-emerald-600 p-5 text-white shrink-0">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold text-base shadow-sm mb-2 ${selectedOrg.logoColor}`}>
                                {getInitials(selectedOrg.name)}
                            </div>
                            <h2 className="text-lg font-semibold text-white text-center">{selectedOrg.name}</h2>
                            <span className="text-xs text-emerald-100 font-mono mt-0.5">ID: {selectedOrg.id}</span>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-5 p-5 md:p-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="col-span-2 bg-slate-50 rounded-xl p-3.5 flex items-center justify-between border border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Workspace Slug</p>
                                        <span className="text-sm font-semibold text-slate-700 mt-0.5 block font-mono">
                                            /{selectedOrg.slug}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedOrg.status === "active" && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                Active
                                            </span>
                                        )}
                                        {selectedOrg.status === "trial" && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                Trial
                                            </span>
                                        )}
                                        {selectedOrg.status === "suspended" && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                Suspended
                                            </span>
                                        )}
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            {selectedOrg.plan} Plan
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Admin Contact Email</span>
                                    <span className="text-slate-700 font-medium flex items-center gap-1.5 mt-0.5">
                                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        {selectedOrg.email}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Contact Phone</span>
                                    <span className="text-slate-700 font-medium flex items-center gap-1.5 mt-0.5">
                                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        {selectedOrg.phone || "--"}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Registered Date</span>
                                    <span className="text-slate-700 font-medium flex items-center gap-1.5 mt-0.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        {selectedOrg.joinedDate}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">License Outlets</span>
                                    <span className="text-slate-700 font-medium flex items-center gap-1.5 mt-0.5">
                                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        {selectedOrg.outlets.length} Branches
                                    </span>
                                </div>

                                <div className="col-span-2 flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Headquarters Address</span>
                                    <span className="text-slate-700 font-medium flex items-center gap-1.5 mt-0.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        {selectedOrg.address || "Address not provided"}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Registered Outlet Branches</h4>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {selectedOrg.outlets.map((outlet, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                            {outlet}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5 md:p-6 bg-slate-50/50 rounded-b-xl shrink-0">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    handleOpenEdit(selectedOrg);
                                }}
                                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
                            >
                                Edit Properties
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal - ADD ORGANIZATION */}
            {isAddModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-sm"
                    onClick={() => !isSaving && setIsAddModalOpen(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl rounded-t-2xl sm:rounded-xl bg-white shadow-xl border border-slate-100 overflow-y-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col"
                    >
                        <div className="relative flex flex-col items-center justify-center bg-emerald-600 p-5 text-white shrink-0">
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <Building2 className="h-6 w-6 text-white mb-0.5" />
                                <h2 className="text-lg font-semibold text-white">Create New Organization</h2>
                            </div>
                            <button
                                disabled={isSaving}
                                onClick={() => setIsAddModalOpen(false)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-60"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="flex flex-col gap-5 p-5 md:p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Organization Name</label>
                                    <input
                                        disabled={isSaving}
                                        type="text"
                                        required
                                        placeholder="e.g. Burger Palace Cafe"
                                        value={formName}
                                        onChange={(e) => {
                                            setFormName(e.target.value);
                                            if (!formSlug || formSlug === formName.toLowerCase().replace(/\s+/g, "-").slice(0, -1)) {
                                                setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                                            }
                                        }}
                                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Tenant Slug</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">/</span>
                                        <input
                                            disabled={isSaving}
                                            type="text"
                                            required
                                            placeholder="burger-palace"
                                            value={formSlug}
                                            onChange={(e) => setFormSlug(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-6 pr-3 text-sm font-mono text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Subscription Plan</label>
                                    <select
                                        disabled={isSaving}
                                        value={formPlan}
                                        onChange={(e) => setFormPlan(e.target.value as SubscriptionPlan)}
                                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <option value="Basic">Basic (1 outlet)</option>
                                        <option value="Pro">Pro (Up to 4 outlets)</option>
                                        <option value="Enterprise">Enterprise (Unlimited)</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Admin Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            disabled={isSaving}
                                            type="email"
                                            required
                                            placeholder="e.g. admin@burgerpalace.com"
                                            value={formEmail}
                                            onChange={(e) => setFormEmail(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Contact Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            disabled={isSaving}
                                            type="text"
                                            placeholder="e.g. +977 1-4412345"
                                            value={formPhone}
                                            onChange={(e) => setFormPhone(e.target.value)}
                                            maxLength={20}
                                            className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Initial Status</label>
                                    <select
                                        disabled={isSaving}
                                        value={formStatus}
                                        onChange={(e) => setFormStatus(e.target.value as OrgStatus)}
                                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <option value="trial">Trial Account</option>
                                        <option value="active">Active Operation</option>
                                        <option value="suspended">Suspended (Locked)</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Headquarters Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            disabled={isSaving}
                                            type="text"
                                            placeholder="e.g. Jhamsikhel, Lalitpur"
                                            value={formAddress}
                                            onChange={(e) => setFormAddress(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">
                                        Branches / Outlets (Comma Separated)
                                    </label>
                                    <input
                                        disabled={isSaving}
                                        type="text"
                                        placeholder="e.g. Kathmandu Main, Pokhara Lakeside, Lalitpur Hub"
                                        value={formOutletsText}
                                        onChange={(e) => setFormOutletsText(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-xs text-slate-400 mt-1.5 block">
                                        Leave blank to automatically create a "Main Branch".
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 -mx-5 md:-mx-6 px-5 md:px-6 -mb-5 md:-mb-6 pb-6 sm:pb-5 bg-slate-50/50">
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 sm:flex-initial rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-initial rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isSaving ? "Creating..." : "Create Organization"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal - EDIT ORGANIZATION */}
            {isEditModalOpen && selectedOrg && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-sm"
                    onClick={() => !isSaving && setIsEditModalOpen(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl rounded-t-2xl sm:rounded-xl bg-white shadow-xl border border-slate-100 overflow-y-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col"
                    >
                        <div className="relative flex flex-col items-center justify-center bg-emerald-600 p-5 text-white shrink-0">
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <Edit2 className="h-6 w-6 text-white mb-0.5" />
                                <h2 className="text-lg font-semibold text-white">Edit Organization Properties</h2>
                            </div>
                            <button
                                disabled={isSaving}
                                onClick={() => setIsEditModalOpen(false)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-60"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-5 p-5 md:p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Organization Name</label>
                                    <input
                                        disabled={isSaving}
                                        type="text"
                                        required
                                        placeholder="e.g. Burger Palace Cafe"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Tenant Slug</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">/</span>
                                        <input
                                            disabled={isSaving}
                                            type="text"
                                            required
                                            placeholder="burger-palace"
                                            value={formSlug}
                                            onChange={(e) => setFormSlug(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-6 pr-3 text-sm font-mono text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Subscription Plan</label>
                                    <select
                                        disabled={isSaving}
                                        value={formPlan}
                                        onChange={(e) => setFormPlan(e.target.value as SubscriptionPlan)}
                                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <option value="Basic">Basic (1 outlet)</option>
                                        <option value="Pro">Pro (Up to 4 outlets)</option>
                                        <option value="Enterprise">Enterprise (Unlimited)</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Admin Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            disabled={isSaving}
                                            type="email"
                                            required
                                            placeholder="e.g. admin@burgerpalace.com"
                                            value={formEmail}
                                            onChange={(e) => setFormEmail(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Contact Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            disabled={isSaving}
                                            type="text"
                                            placeholder="e.g. +977 1-4412345"
                                            value={formPhone}
                                            onChange={(e) => setFormPhone(e.target.value)}
                                            maxLength={20}
                                            className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Account Status</label>
                                    <select
                                        disabled={isSaving}
                                        value={formStatus}
                                        onChange={(e) => setFormStatus(e.target.value as OrgStatus)}
                                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <option value="trial">Trial Account</option>
                                        <option value="active">Active Operation</option>
                                        <option value="suspended">Suspended (Locked)</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">Headquarters Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            disabled={isSaving}
                                            type="text"
                                            placeholder="e.g. Jhamsikhel, Lalitpur"
                                            value={formAddress}
                                            onChange={(e) => setFormAddress(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-slate-500">
                                        Branches / Outlets (Comma Separated)
                                    </label>
                                    <input
                                        disabled={isSaving}
                                        type="text"
                                        placeholder="e.g. Kathmandu Main, Pokhara Lakeside"
                                        value={formOutletsText}
                                        onChange={(e) => setFormOutletsText(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 -mx-5 md:-mx-6 px-5 md:px-6 -mb-5 md:-mb-6 pb-6 sm:pb-5 bg-slate-50/50">
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 sm:flex-initial rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-initial rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
                        <div className="flex flex-col items-center text-center gap-3 p-6 border-b border-slate-100">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                                <Trash2 className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Delete Organization?</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    This will permanently remove{" "}
                                    <span className="font-medium text-slate-700">
                                        "{organizations.find((o) => o.id === deleteConfirmId)?.name}"
                                    </span>{" "}
                                    and all associated outlets, menus, and staff records. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6">
                            <button
                                disabled={isDeleting}
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isDeleting}
                                onClick={handleDeleteConfirm}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}