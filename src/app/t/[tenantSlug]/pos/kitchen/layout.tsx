import React from 'react';

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0c0c0d] text-[#e4e4e7] antialiased">
      {children}
    </div>
  );
}