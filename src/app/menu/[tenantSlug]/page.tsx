// import React from "react";
// import { db } from "@/db";
// import { formatProduct } from "@/controller/product";
// import MenuClient from "./MenuClient";

// interface PageProps {
//   params: Promise<{ tenantSlug: string }>;
//   searchParams: Promise<{ outletId?: string }>;
// }

// export default async function PublicMenuPage({
//   params,
//   searchParams,
// }: PageProps) {
//   const { tenantSlug } = await params;
//   const { outletId } = await searchParams;

//   const org = await db.query.organizations.findFirst({
//     where: (o, { eq }) => eq(o.slug, tenantSlug),
//   });

//   if (!org) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
//         <div className="bg-white p-8 rounded-2xl shadow-sm max-w-sm w-full border border-slate-100">
//           <h2 className="text-xl font-bold text-slate-800">Restaurant Not Found</h2>
//           <p className="text-sm text-slate-500 mt-2">
//             The menu you are looking for does not exist or has been moved.
//           </p>
//         </div>
//       </div>
//     );
//   }


//   let selectedOutlet = null;
//   if (outletId) {
//     selectedOutlet = await db.query.outlets.findFirst({
//       where: (o, { eq, and }) =>
//         and(eq(o.id, outletId), eq(o.organizationId, org.id)),
//     });
//   }

  
//   if (!selectedOutlet) {
//     selectedOutlet = await db.query.outlets.findFirst({
//       where: (o, { eq, and }) =>
//         and(eq(o.organizationId, org.id), eq(o.isActive, true)),
//     });
//   }

//   if (!selectedOutlet) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
//         <div className="bg-white p-8 rounded-2xl shadow-sm max-w-sm w-full border border-slate-100">
//           <h2 className="text-xl font-bold text-slate-800">No Active Branch</h2>
//           <p className="text-sm text-slate-500 mt-2">
//             There are no active outlets currently registered for this restaurant.
//           </p>
//         </div>
//       </div>
//     );
//   }


//   const categoriesList = await db.query.categories.findMany({
//     where: (c, { eq, and }) =>
//       and(eq(c.outletId, selectedOutlet.id), eq(c.isActive, true)),
//     orderBy: (c, { asc }) => asc(c.sortOrder),
//     columns: {
//       id: true,
//       name: true,
//     },
//   });


//   const productsList = await db.query.products.findMany({
//     where: (p, { eq, and }) =>
//       and(eq(p.outletId, selectedOutlet.id), eq(p.isActive, true)),
//     orderBy: (p, { asc }) => asc(p.createdAt),
//     columns: {
//       id: true,
//       categoryId: true,
//       name: true,
//       description: true,
//       price: true,
//       imagePublicId: true,
//     },
//   });


//   const formattedProducts = productsList.map((p) => {
//     const formatted = formatProduct({
//       id: p.id,
//       categoryId: p.categoryId,
//       name: p.name,
//       description: p.description,
//       price: p.price,
//       imagePublicId: p.imagePublicId,
//     }) as any;
//     return {
//       id: formatted.id,
//       categoryId: formatted.categoryId,
//       name: formatted.name,
//       description: formatted.description,
//       price: formatted.price,
//       imageUrl: formatted.imageUrl,
//     };
//   });

//   return (
//     <MenuClient
//       orgName={org.name}
//       outletName={selectedOutlet.name}
//       categories={categoriesList}
//       products={formattedProducts}
//     />
//   );
// }

export default function DummyMenuPage() {
  return null;
}
