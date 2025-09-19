// // This is your page component, e.g., /usercategory/[categoryId]/page.tsx

// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { ArrowLeft, SearchX } from "lucide-react";

// import FilterNav from "@/components/FilterNav";
// import { Service, FilterState } from "@/type";
// import { getCategoryWithServices } from "@/lib/supabase-utils";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import DivCenter from "@/components/divCenter";

// const initialFilterState: FilterState = {
//   searchTerm: "",
//   locations: [],
//   categoryId: null,
//   companyIds: [],
// };

// const ServicesListPage = () => {
//   const [services, setServices] = useState<Service[]>([]);
//   const [categoryName, setCategoryName] = useState<string>("");
//   const [categoryIcon, setCategoryIcon] = useState<string>("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [filters, setFilters] = useState<FilterState>(initialFilterState); // State to hold current filters
//   const router = useRouter();
//   const params = useParams();
//   const categoryId = params.categoryId as string;

//   useEffect(() => {
//     if (categoryId) {
//       const fetchData = async () => {
//         setIsLoading(true);
//         const categoryData = await getCategoryWithServices(categoryId);

//         if (categoryData) {
//           setServices(categoryData.services || []);
//           setCategoryName(categoryData.name);
//           setCategoryIcon(categoryData.icon);
//           // --- FIX 1: Initialize the filters state with the categoryId ---
//           setFilters((prevFilters) => ({ ...prevFilters, categoryId: categoryId }));
//         } else {
//           setCategoryName("Category not found");
//           setServices([]);
//         }
//         setIsLoading(false);
//       };
//       fetchData();
//     }
//   }, [categoryId]); // Depend on categoryId to re-fetch/update filters when it changes

//   const filteredServices = useMemo(() => {
//     let filtered = services;
//     // The `filters` state now includes `categoryId` from the `useEffect`
//     // No need to explicitly filter by categoryId here if `services` are already
//     // pre-filtered by category from `getCategoryWithServices`.
//     // However, if `services` is the full list, then:
//     if (filters.categoryId && services.length > 0 && services[0].category_id !== filters.categoryId) {
//       // This condition ensures we don't re-filter if already filtered by the API
//       // If getCategoryWithServices already returns services only for that category, this filter is redundant.
//       // If `services` is ALL services, then this filter applies.
//       filtered = filtered.filter(service => service.category_id === filters.categoryId);
//     }

//     if (filters.searchTerm) {
//       const lowercasedTerm = filters.searchTerm.toLowerCase();
//       filtered = filtered.filter(
//         (service) =>
//           service.name.toLowerCase().includes(lowercasedTerm) ||
//           service.company?.name?.toLowerCase().includes(lowercasedTerm)
//       );
//     }
//     if (filters.companyIds.length > 0) {
//       filtered = filtered.filter((service) =>
//         filters.companyIds.includes(service.company_id)
//       );
//     }
//     if (filters.locations.length > 0) {
//       const selectedLocationValues = filters.locations.map((loc) => loc.value);
//       filtered = filtered.filter(
//         (service) =>
//           service.company?.location_text &&
//           selectedLocationValues.includes(service.company.location_text)
//       );
//     }
//     return filtered;
//   }, [services, filters]);

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="flex items-center gap-3 text-lg text-slate-600">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
//           Loading services...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <DivCenter>
//       <div className="container my-20">
//         <div className=" flex justify-between items-center    ">
//           <Button
//             variant="ghost"
//             onClick={() => router.back()}
//             className="mb-4 text-slate-600 hover:text-slate-900 md:bg-none bg-slate-100 "
//           >
//             <ArrowLeft className="mr-2 h-4 w-4" />
//             <span className="md:block hidden">Back to Categories</span>
//           </Button>
//           <div className="flex md:flex-row flex-row-reverse  md:items-center items-end md:gap-4 dm:mt-[-10px] mt-[-20px]">
//             <div className="md:text-5xl text-3xl">{categoryIcon}</div>
//             <div>
//               <h1 className="text-2xl md:text-4xl font-bold text-slate-800 uppercase">
//                 {categoryName}
//               </h1>
//             </div>
//           </div>
//         </div>

//         <div className="my-6">
//           <FilterNav
//             onFilterChange={setFilters}
//             filters={filters} // --- FIX 2: Pass the 'filters' state here ---
//             isCategoryLocked={true}
//           />
//         </div>

//         {filteredServices.length === 0 ? (
//           <div className="text-center mt-12">
//              <SearchX className="mx-auto h-16 w-16 text-slate-400" />
//             <h3 className="mt-2 text-xl font-semibold text-slate-800">
//               No services found
//             </h3>
//             <p className="mt-1 text-slate-500">
//               Try adjusting your filters or check back later.
//             </p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
//             {filteredServices.map((service) => (
//               <Link
//                 key={service.id}
//                 href={`/services/${service.id}?companyId=${service.company_id}`}
//                 className="block bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
//               >
//                 <div className="text-lg font-semibold text-gray-900">
//                   {service.name}
//                 </div>
//                 {service.company && (
//                   <div className="mt-1 inline-block text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
//                     {service.company.name}
//                   </div>
//                 )}
//                 <p className="mt-3 text-slate-600 text-sm line-clamp-2">
//                   {service.description}
//                 </p>
//                 <div className="flex justify-between items-center border-t pt-3 mt-4 text-sm">
//                   <span className="text-green-600 font-bold text-base">
//                     ${service.price}
//                   </span>
//                   {service.estimated_wait_time_mins && (
//                     <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
//                       ~{service.estimated_wait_time_mins} min
//                     </span>
//                   )}
//                 </div>
//               </Link>
//             ))}
//           </div>
//         )}
//       </div>
//     </DivCenter>
//   );
// };

// export default ServicesListPage;