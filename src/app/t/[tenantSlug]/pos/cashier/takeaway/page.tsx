"use client";

import React, { use } from "react";
import Order from "../../_components/order";
import { ThemeProvider, useTheme } from "../../context/ThemeContext";

interface TakeawayPageProps {
  params: Promise<{ tenantSlug: string }>;
}

function TakeawayPageInner({ tenantSlug }: { tenantSlug: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      style={{ backgroundColor: isDark ?  '#0c0c0d' : '#f6fdf7' }}
      className="h-screen w-full overflow-hidden flex flex-col transition-colors duration-200"
    >
      <Order tenantSlug={tenantSlug} orderType="TAKEAWAY" />
    </div>
  );
}

export default function TakeawayPage({ params }: TakeawayPageProps) {
  const { tenantSlug } = use(params);

  return (
    <ThemeProvider role="cashier">
      <TakeawayPageInner tenantSlug={tenantSlug} />
    </ThemeProvider>
  );
}