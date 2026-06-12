"use client";

import React, { useState, use } from "react";

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default function StaffsPage({ params }: PageProps) {
  const { tenantSlug } = use(params);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role: "Cashier" });
  const [isSending, setIsSending] = useState(false);

  const [staffList, setStaffList] = useState([
    { name: "Niraj Thapa", email: "niraj@burgerpalace.com", role: "Owner", status: "ACTIVE" },
    { name: "Sam Smith", email: "sam@burgerpalace.com", role: "Store Manager", status: "ACTIVE" },
    { name: "Aarav Sharma", email: "aarav@gmail.com", role: "Cashier", status: "PENDING" },
  ]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setStaffList([
        ...staffList,
        { name: formData.name, email: formData.email, role: formData.role, status: "PENDING" },
      ]);
      setIsSending(false);
      setIsPanelOpen(false);
      setFormData({ name: "", email: "", role: "Cashier" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-gray-900 p-8 relative overflow-hidden">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-zinc-200">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-1">Management</p>
          <h1 className="text-2xl font-semibold text-black tracking-tight">Staff</h1>
        </div>

        <button
          onClick={() => setIsPanelOpen(true)}
          className="group relative h-11 rounded-full font-medium px-8 bg-black text-white border border-black hover:bg-transparent hover:text-black flex items-center overflow-hidden transition-colors duration-300 self-start md:self-auto select-none"
        >
          <span className="relative inline-flex overflow-hidden">
            <div className="translate-y-0 skew-y-0 transition duration-500 group-hover:-translate-y-[110%] group-hover:skew-y-12 text-sm">
              + Add Member
            </div>
            <div className="absolute translate-y-[110%] skew-y-12 transition duration-500 group-hover:translate-y-0 group-hover:skew-y-0 text-sm whitespace-nowrap">
              + Add Member
            </div>
          </span>
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Staff", value: staffList.length },
          { label: "Active", value: staffList.filter(s => s.status === "ACTIVE").length },
          { label: "Pending", value: staffList.filter(s => s.status === "PENDING").length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-zinc-200 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold text-black">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black">
                <th className="px-5 py-3.5 text-xs uppercase tracking-[0.15em] font-medium text-zinc-400">Name</th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-[0.15em] font-medium text-zinc-400">Email</th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-[0.15em] font-medium text-zinc-400">Role</th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-[0.15em] font-medium text-zinc-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {staffList.map((member, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-black">{member.name}</td>
                  <td className="px-5 py-4 text-zinc-500">{member.email}</td>
                  <td className="px-5 py-4 text-zinc-600">{member.role}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 uppercase tracking-wide rounded-full ${
                      member.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-600 animate-pulse"
                    }`}>
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slideout Panel */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-sm"
            onClick={() => setIsPanelOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white border-l border-zinc-200 h-full p-8 flex flex-col justify-between z-10">
            <div className="space-y-8">

              <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-0.5">Team</p>
                  <h3 className="text-base font-semibold text-black tracking-tight">Invite Member</h3>
                </div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="text-xs uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.15em] text-zinc-500 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-transparent border-b border-zinc-300 focus:border-black outline-none py-2.5 text-sm text-black placeholder-zinc-300 transition-colors duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.15em] text-zinc-500 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent border-b border-zinc-300 focus:border-black outline-none py-2.5 text-sm text-black placeholder-zinc-300 transition-colors duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.15em] text-zinc-500 block">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-transparent border-b border-zinc-300 focus:border-black outline-none py-2.5 text-sm text-black appearance-none cursor-pointer transition-colors duration-200"
                    >
                      <option value="Store Manager">Store Manager</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Inventory Clerk">Inventory Clerk</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-zinc-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="group relative h-11 w-full rounded-full font-medium px-8 bg-black text-white border border-black hover:bg-transparent hover:text-black flex items-center justify-center overflow-hidden transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed select-none"
                  >
                    <span className="relative inline-flex overflow-hidden">
                      <div className="translate-y-0 skew-y-0 transition duration-500 group-hover:-translate-y-[110%] group-hover:skew-y-12 text-sm">
                        {isSending ? "Sending..." : "Send Invitation"}
                      </div>
                      <div className="absolute translate-y-[110%] skew-y-12 transition duration-500 group-hover:translate-y-0 group-hover:skew-y-0 text-sm whitespace-nowrap">
                        {isSending ? "Sending..." : "Send Invitation"}
                      </div>
                    </span>
                  </button>
                </div>
              </form>
            </div>

            <p className="text-xs text-zinc-300 uppercase tracking-widest">
              Staff Management — {tenantSlug}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}