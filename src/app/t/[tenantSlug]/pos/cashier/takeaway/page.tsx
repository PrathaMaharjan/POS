
"use client";

import React, { use } from "react";
import Order from "../../_components/order";

interface TakeawayPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default function TakeawayPage({ params }: TakeawayPageProps) {

  const { tenantSlug } = use(params);

  return (
    <div className="h-screen w-full bg-[#0c0c0d] overflow-hidden flex flex-col">

      <Order tenantSlug={tenantSlug} orderType="TAKEAWAY" />
    </div>
  );
}