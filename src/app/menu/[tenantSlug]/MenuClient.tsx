// "use client";

// import React, { useState, useMemo } from "react";
// import Image from "next/image";
// import { Search, ImageOff, SearchX } from "lucide-react";

// interface Category {
//   id: string;
//   name: string;
// }

// interface Product {
//   id: string;
//   categoryId: string;
//   name: string;
//   description: string | null;
//   price: number;
//   imageUrl: string | null;
// }

// interface MenuClientProps {
//   orgName: string;
//   outletName: string;
//   categories: Category[];
//   products: Product[];
// }

// export default function MenuClient({
//   orgName,
//   outletName,
//   categories,
//   products,
// }: MenuClientProps) {
//   const [activeCategory, setActiveCategory] = useState<string>("ALL");
//   const [searchQuery, setSearchQuery] = useState("");

//   const filteredProducts = useMemo(() => {
//     return products.filter((p) => {
//       const matchesCategory =
//         activeCategory === "ALL" || p.categoryId === activeCategory;
//       const matchesSearch = p.name
//         .toLowerCase()
//         .includes(searchQuery.toLowerCase());
//       return matchesCategory && matchesSearch;
//     });
//   }, [products, activeCategory, searchQuery]);

//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">

//       <header className="bg-emerald-600 text-white px-6 py-6 shadow-sm text-center shrink-0">
//         <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest">
//           {orgName}
//         </h1>

//       </header>


//       <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6 overflow-hidden">

//         <div className="relative">
//           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
//             <Search className="w-4 h-4" />
//           </div>
//           <input
//             type="text"
//             placeholder="Search menu items..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 placeholder-slate-400 shadow-sm"
//           />
//         </div>


//         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0 snap-x">
//           <button
//             onClick={() => setActiveCategory("ALL")}
//             className={`snap-start px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all ${activeCategory === "ALL"
//               ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
//               : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
//               }`}
//           >
//             All Items
//           </button>

//           {categories.map((category) => (
//             <button
//               key={category.id}
//               onClick={() => setActiveCategory(category.id)}
//               className={`snap-start px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all ${activeCategory === category.id
//                 ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
//                 : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
//                 }`}
//             >
//               {category.name}
//             </button>
//           ))}
//         </div>


//         <div className="flex-1 overflow-y-auto">
//           {filteredProducts.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
//               <SearchX className="w-12 h-12" strokeWidth={1.5} />
//               <span className="text-sm font-semibold">No items found</span>
//             </div>
//           ) : (
//             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10">
//               {filteredProducts.map((product) => (
//                 <div
//                   key={product.id}
//                   className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col gap-3 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
//                 >

//                   <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
//                     {product.imageUrl ? (
//                       <Image
//                         src={product.imageUrl}
//                         alt={product.name}
//                         fill
//                         sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
//                         className="object-cover"
//                       />
//                     ) : (
//                       <ImageOff
//                         className="w-8 h-8 text-slate-300"
//                         strokeWidth={1.5}
//                       />
//                     )}
//                   </div>


//                   <div className="flex flex-col flex-1 justify-between gap-1.5">
//                     <div className="flex flex-col gap-0.5">
//                       <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 break-words">
//                         {product.name}
//                       </h4>
//                       {product.description && (
//                         <p className="text-[11px] text-slate-400 line-clamp-2 break-words">
//                           {product.description}
//                         </p>
//                       )}
//                     </div>
//                     <span className="text-sm font-bold text-emerald-600 block pt-1">
//                       Rs. {product.price.toFixed(2)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
