import Sidebar from "./components/Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function TenantLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      

      <Sidebar />

     
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}