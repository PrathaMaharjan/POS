import React from "react";
import Link from "next/link";

interface SidebarProps {
  tenantSlug: string;
}

export default function Sidebar({ tenantSlug }: SidebarProps) {
  const links = [
    { name: "Dashboard", href: `/t/${tenantSlug}/dashboard` },
    { name: "Sales", href: `/t/${tenantSlug}/sales` },
    { name: "Products", href: `/t/${tenantSlug}/products` },
    { name: "Customers", href: `/t/${tenantSlug}/customers` },
    { name: "Reports", href: `/t/${tenantSlug}/reports` },
    { name: "Staffs", href: `/t/${tenantSlug}/staffs` },
    { name: "Outlets", href: `/t/${tenantSlug}/outlets` },
    { name: "Settings", href: `/t/${tenantSlug}/settings` },
  ];

  return (
    <aside className="w-70 bg-black text-zinc-400 h-screen p-6 border-r border-zinc-900 flex flex-col justify-between select-none">
      <div>
        
        <div className="mb-10 space-y-1">
          <h2 className="pt-5 text-3xl font-bold text-white tracking-tight">
            POS System
          </h2>
          <br/>
          <hr className="border-zinc-800" />
        </div>

      
        <nav className="space-y-3 flex flex-col">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-normal text-zinc-400 py-3 px-4 border border-transparent rounded-lg hover:border-zinc-800 hover:bg-zinc-900/50 hover:text-white hover:translate-y-1 transition-all duration-350"
            >
              {link.name}
            </Link>
          ))}
        </nav>

      </div>


      <div className="pt-4 border-t border-zinc-800 flex items-center justify-center">
        <Link 
          href="/login" 
          className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200"
        >
          Logout
        </Link>
      </div>

    </aside>
  );
}