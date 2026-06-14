import React from 'react';
import KdsBoard from './kdsBoard';

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function KitchenPage({ params }: PageProps) {
  const unwrappedParams = await params;

  return (
    <KdsBoard tenantSlug={unwrappedParams.tenantSlug} />
  );
}