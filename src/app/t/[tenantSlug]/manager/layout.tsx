import AdminNavbar from "../_components/AdminNavbar";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-slate-900">
      <AdminNavbar role="manager" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-white">
        {children}
      </main>
    </div>
  );
}