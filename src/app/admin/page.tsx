import { Building2, CreditCard, Receipt, Users } from "lucide-react";

export default function SuperAdminOverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Platform Overview</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Organizations</p>
            <p className="text-xl font-semibold text-slate-800">--</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Subscriptions</p>
            <p className="text-xl font-semibold text-slate-800">--</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Invoices</p>
            <p className="text-xl font-semibold text-slate-800">--</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Platform Users</p>
            <p className="text-xl font-semibold text-slate-800">--</p>
          </div>
        </div>
      </div>

    
    </div>
  );
}