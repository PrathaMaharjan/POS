import AdminNavbar from "@/app/t/[tenantSlug]/_components/AdminNavbar";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased flex">
      {/* Sidebar Navigation Context Container */}
      <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-slate-200 bg-white">
        <AdminNavbar role="org" />
      </aside>

      <div className="flex-1 pl-64">
        <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}