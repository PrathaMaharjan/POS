import Sidebar from "./components/Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>; 
}

export default async function TenantLayout({ children, params }: LayoutProps) {
 
  const { tenantSlug } = await params;

  return (
    <div className="flex min-h-screen bg-black">
  
      <Sidebar tenantSlug={tenantSlug} />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}