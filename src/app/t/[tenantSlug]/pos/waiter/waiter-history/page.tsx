"use client";

import React, { use } from 'react';
import History from '../../cashier/history/page';

interface WaiterHistoryPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default function WaiterHistoryPage({ params }: WaiterHistoryPageProps) {
  const unwrappedParams = use(params);

  return (
    <History 
      tenantSlug={unwrappedParams.tenantSlug} 
      role="waiter" 
    />
  );
}