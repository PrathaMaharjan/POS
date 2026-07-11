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
  Globe,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { getImageUrl } from "@/lib/cloudinary/storage";

interface Organization {
  id: string;
  name: string;
  slug: string;
  imagePublicId: string | null;
  isActive: boolean;
  createdAt: string;
  imageUrl: string | null;
  totalOutlets: number;
  totalStaff: number;
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

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgDetails, setOrgDetails] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    outletName: "Main Branch",
    phone: "",
    address: "",
    imagePublicId: "",
  });

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const { uploadImage, uploading: imageUploading, error: uploadError } = useImageUpload();

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/organization");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
      } else {
        console.error("Failed to fetch organizations: HTTP status", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter((o) => o.isActive).length;
  const suspendedOrgs = organizations.filter((o) => !o.isActive).length;

  const filteredOrgs = organizations.filter((org) => {
    const matchText = search.toLowerCase();
    const details = orgDetails[org.id] || {};
    const phone = details.outlets?.[0]?.phone || "";
    return (
      org.name.toLowerCase().includes(matchText) ||
      org.slug.toLowerCase().includes(matchText) ||
      phone.includes(search)
    );
  });

  const totalItems = filteredOrgs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginatedOrgs = filteredOrgs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    let active = true;
    const loadDetails = async () => {
      const orgsToFetch = paginatedOrgs.filter((org) => !orgDetails[org.id]);
      if (orgsToFetch.length === 0) return;

      try {
        const details = await Promise.all(
          orgsToFetch.map((org) =>
            fetch(`/api/superadmin/organization/${org.id}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );

        if (!active) return;

        setOrgDetails((prev) => {
          const next = { ...prev };
          details.forEach((d) => {
            if (d && d.id) {
              next[d.id] = d;
            }
          });
          return next;
        });
      } catch (err) {
        console.error("Failed to load organization details:", err);
      }
    };

    if (paginatedOrgs.length > 0) {
      loadDetails();
    }

    return () => {
      active = false;
    };
  }, [paginatedOrgs]);

  function resetForm() {
  setForm({
    name: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    outletName: "Main Branch",
    phone: "",
    address: "",
    imagePublicId: "",
  });
  setLogoPreviewUrl(null);
  setEditingOrg(null);
  setErrorMsg(null);
  setShowPassword(false);
}

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getBrandColor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % BRAND_COLORS.length;
    return BRAND_COLORS[index];
  }

  function handleOpenEdit(org: Organization) {
    setEditingOrg(org);
    const details = orgDetails[org.id] || {};
    setForm({
      name: org.name,
      slug: org.slug,
      ownerName: details.owner?.name || "",
      ownerEmail: details.owner?.email || "",
      ownerPassword: "",
      outletName: details.outlets?.[0]?.name || "Main Branch",
      phone: details.outlets?.[0]?.phone || "",
      address: details.outlets?.[0]?.address || "",
      imagePublicId: org.imagePublicId || "",
    });
    setLogoPreviewUrl(org.imageUrl || null);
    setErrorMsg(null);
    setIsModalOpen(true);
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadImage(file);
    if (result) {
      setForm((prev) => ({ ...prev, imagePublicId: result.publicId }));
      const url = getImageUrl(result.publicId, { width: 200, height: 200 });
      setLogoPreviewUrl(url);
    }
  };

  async function handleSaveOrg() {
    if (editingOrg) {
      if (!form.name) return;
      setIsSaving(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/superadmin/organization/${editingOrg.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            imagePublicId: form.imagePublicId || undefined,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          let msg = "Failed to update organization";
          if (errData.error) {
            if (typeof errData.error === "object" && errData.error.fieldErrors) {
              const errors = errData.error.fieldErrors;
              msg = Object.keys(errors)
                .map((k) => `${k}: ${errors[k].join(", ")}`)
                .join("; ");
            } else {
              msg = String(errData.error);
            }
          }
          throw new Error(msg);
        }

        const data = await res.json();
        setOrganizations((prev) =>
          prev.map((o) =>
            o.id === editingOrg.id
              ? {
                ...o,
                name: form.name,
                imagePublicId: form.imagePublicId || null,
                imageUrl: data.imageUrl || null,
              }
              : o
          )
        );
        resetForm();
        setIsModalOpen(false);
      } catch (err) {
        console.error("Failed to save organization:", err);
        setErrorMsg(err instanceof Error ? err.message : "Failed to save organization");
      } finally {
        setIsSaving(false);
      }
    } else {
      if (!form.name || !form.ownerName || !form.ownerEmail || !form.ownerPassword) {
        setErrorMsg("Please fill in all required fields (Organization Name, Owner Name, Email, Password).");
        return;
      }
      setIsSaving(true);
      setErrorMsg(null);
      try {
        const payload = {
          name: form.name,
          slug: form.slug || undefined,
          outletName: form.outletName || undefined,
          address: form.address || undefined,
          phone: form.phone || undefined,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          ownerPassword: form.ownerPassword,
          imagePublicId: form.imagePublicId || undefined,
        };
        const res = await fetch("/api/superadmin/organization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          let msg = "Failed to create organization";
          if (errData.error) {
            if (typeof errData.error === "object" && errData.error.fieldErrors) {
              const errors = errData.error.fieldErrors;
              msg = Object.keys(errors)
                .map((k) => `${k}: ${errors[k].join(", ")}`)
                .join("; ");
            } else {
              msg = String(errData.error);
            }
          }
          throw new Error(msg);
        }

        await fetchOrganizations();
        resetForm();
        setIsModalOpen(false);
      } catch (err) {
        console.error("Failed to save organization:", err);
        setErrorMsg(err instanceof Error ? err.message : "Failed to save organization");
      } finally {
        setIsSaving(false);
      }
    }
  }

  async function handleDeleteOrg(id: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/superadmin/organization/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete organization");
      }
      setOrganizations((prev) => prev.filter((o) => o.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete organization:", err);
      alert(err instanceof Error ? err.message : "Failed to delete organization");
    } finally {
      setIsDeleting(false);
    }
  }

  async function toggleStatus(id: string, currentIsActive: boolean) {
    try {
      const endpoint = currentIsActive ? "suspend" : "active";
      const res = await fetch(`/api/superadmin/organization/${id}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Failed to ${endpoint} organization`);
      }
      setOrganizations((prev) =>
        prev.map((o) => (o.id === id ? { ...o, isActive: !currentIsActive } : o))
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>

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
                    <th className="py-3 px-4">Outlets / Staff</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {org.imageUrl ? (
                            <img
                              src={org.imageUrl}
                              alt={org.name}
                              className="h-9 w-9 shrink-0 rounded-lg object-cover border border-slate-200 shadow-sm"
                            />
                          ) : (
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs shadow-sm border border-black/5 ${getBrandColor(
                                org.id
                              )}`}
                            >
                              {getInitials(org.name)}
                            </div>
                          )}
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
                            <span className="truncate max-w-[160px] font-medium text-slate-700">
                              {orgDetails[org.id] ? (
                                orgDetails[org.id].owner?.email || "No Owner Email"
                              ) : (
                                <span className="text-slate-300 animate-pulse">loading...</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-slate-500 font-semibold">
                              {orgDetails[org.id] ? (
                                orgDetails[org.id].outlets?.[0]?.phone || "—"
                              ) : (
                                <span className="text-slate-300 animate-pulse">loading...</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs max-w-[180px]">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {orgDetails[org.id] ? (
                              orgDetails[org.id].outlets?.[0]?.address || "—"
                            ) : (
                              <span className="text-slate-300 animate-pulse">loading...</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col text-xs text-slate-500">
                          <div>
                            Outlets: <span className="font-semibold text-slate-700">{org.totalOutlets}</span>
                          </div>
                          <div className="mt-0.5">
                            Staff: <span className="font-semibold text-slate-700">{org.totalStaff}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(org.id, org.isActive)}
                          title="Click to toggle status"
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${org.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : "bg-rose-50 text-rose-700 border border-rose-200/50"
                            }`}
                        >
                          <span
                            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${org.isActive ? "bg-emerald-600" : "bg-rose-600"
                              }`}
                          />
                          {org.isActive ? "Active" : "Suspended"}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(org)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="Edit Tenant Name"
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

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-sm"
          onClick={() => !isSaving && setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-t-2xl sm:rounded-xl bg-white shadow-xl border border-slate-100 overflow-y-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col"
          >
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

            <div className="flex flex-col gap-5 p-5 md:p-6 overflow-y-auto">
              {errorMsg && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
                  {errorMsg}
                </div>
              )}

              {editingOrg ? (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3">
                    Note: Only the organization name and logo can be modified from this management interface. To manage specific outlets or staff members, please log into the organization's tenant dashboard.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Organization Name
                      </label>
                      <input
                        disabled={isSaving}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder=""
                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Organization Logo
                      </label>
                      <div className="flex items-center gap-4 border border-slate-200/80 rounded-lg px-3 py-1.5 bg-slate-50/30">
                        {logoPreviewUrl ? (
                          <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                            <img
                              src={logoPreviewUrl}
                              alt="Logo preview"
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({ ...prev, imagePublicId: "" }));
                                setLogoPreviewUrl(null);
                              }}
                              className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5 hover:bg-red-700 transition-colors"
                              title="Remove Logo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100/50 text-slate-400">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <input
                            type="file"
                            accept="image/*"
                            id="logo-upload-edit"
                            className="hidden"
                            onChange={handleLogoChange}
                            disabled={imageUploading || isSaving}
                          />
                          <label
                            htmlFor="logo-upload-edit"
                            className={`inline-flex items-center justify-center gap-1.5 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 transition-all ${imageUploading || isSaving ? "opacity-60 pointer-events-none" : ""
                              }`}
                          >
                            {imageUploading ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                                Uploading...
                              </>
                            ) : (
                              "Upload Logo"
                            )}
                          </label>
                          {uploadError && (
                            <span className="text-[10px] font-medium text-rose-600">{uploadError}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b border-slate-100 pb-1">
                    <h3 className="text-sm font-semibold text-slate-800">Organization Settings</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Organization Name *
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
                          setForm({ ...form, name, slug });
                        }}
                        placeholder="Enter the name of organization"
                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Slug
                      </label>
                      <input
                        disabled={isSaving}
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="Enter your slug"
                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Logo Section */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Organization Logo
                    </label>
                    <div className="flex items-center gap-4 border border-slate-200/80 rounded-lg p-3 bg-slate-50/30">
                      {logoPreviewUrl ? (
                        <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={logoPreviewUrl}
                            alt="Logo preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, imagePublicId: "" }));
                              setLogoPreviewUrl(null);
                            }}
                            className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5 hover:bg-red-700 transition-colors"
                            title="Remove Logo"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100/50 text-slate-400">
                          <Building2 className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="file"
                          accept="image/*"
                          id="logo-upload-create"
                          className="hidden"
                          onChange={handleLogoChange}
                          disabled={imageUploading || isSaving}
                        />
                        <label
                          htmlFor="logo-upload-create"
                          className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 transition-all ${imageUploading || isSaving ? "opacity-60 pointer-events-none" : ""
                            }`}
                        >
                          {imageUploading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                              Uploading Logo...
                            </>
                          ) : (
                            "Upload Logo Image"
                          )}
                        </label>
                        {uploadError && (
                          <span className="text-[10px] font-medium text-rose-600">{uploadError}</span>
                        )}

                      </div>
                    </div>
                  </div>

                  <div className="border-b border-slate-100 pb-1 pt-2">
                    <h3 className="text-sm font-semibold text-slate-800">Owner Account Credentials</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Owner Full Name
                      </label>
                      <input
                        disabled={isSaving}
                        value={form.ownerName}
                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                        placeholder="Enter the name of the owner"
                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Owner Email Address *
                      </label>
                      <input
                        type="email"
                        disabled={isSaving}
                        value={form.ownerEmail}
                        onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                        placeholder="Enter the email"
                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>

               <div>
  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
    Owner Password *
  </label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      disabled={isSaving}
      value={form.ownerPassword}
      onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
      placeholder="Enter a secure password (min 8 characters)"
      className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 pr-9 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
    />
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      disabled={isSaving}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-60"
      tabIndex={-1}
    >
      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  </div>
</div>

                  <div className="border-b border-slate-100 pb-1 pt-2">
                    <h3 className="text-sm font-semibold text-slate-800">Initial Outlet Settings</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Initial Outlet Name
                      </label>
                      <input
                        disabled={isSaving}
                        value={form.outletName}
                        onChange={(e) => setForm({ ...form, outletName: e.target.value })}
                        placeholder="e.g. Main Branch"
                        className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Outlet Phone Number
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
                      Outlet Address / Location
                    </label>
                    <input
                      disabled={isSaving}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="e.g. New Baneshwor, Kathmandu"
                      className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-60"
                    />
                  </div>
                </>
              )}
            </div>

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
                  Are you sure you want to delete this tenant system?
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