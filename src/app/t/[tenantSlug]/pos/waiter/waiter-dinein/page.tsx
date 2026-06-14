"use client";

import React, { use } from 'react';
import Tables from '../../cashier/dinein/page';

interface WaiterDineInPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default function WaiterDineInPage({ params }: WaiterDineInPageProps) {

  const unwrappedParams = use(params);


  return (
    <Tables 
      tenantSlug={unwrappedParams.tenantSlug} 
      role="waiter" 
    />
  );
}