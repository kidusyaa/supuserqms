// // app/userservices/page.tsx
// "use client";

// import React, { useMemo, Suspense, useState } from "react";
// import { useSearchParams } from "next/navigation";

// // --- CORE COMPONENTS ---

// import FilterNav from "@/components/FilterNav";
// import ServiceDetailView from "@/components/ServiceDetailView";
// import BookingForm, { BookingData } from "@/components/BookingForm";

// // --- DATA & TYPES ---
// import { mockServices } from "@/components/data/services";
// import { mockCompanies } from "@/components/data/company";
// import { Service, Company } from "@/type";
// import { FilterState } from "@/type";

// // --- HOOKS & UTILITIES ---
// import { useFavorites } from "@/hooks/useFavorites";
// import { Toaster, toast } from "react-hot-toast";
// import { Dialog, DialogContent } from "@/components/ui/dialog";
// import { Card, CardContent } from "@/components/ui/card";
// import { Clock, Heart, Search } from "lucide-react";


// // --- Reusable Card Component (No changes needed) ---
// const SearchResultCard = ({ service, company, isFavorite, onToggleFavorite, onBookClick }: {
//   service: Service;
//   company?: Company;
//   isFavorite: boolean;
//   onToggleFavorite: (serviceId: string) => void;
//   onBookClick: (service: Service) => void;
// }) => {
//   const handleFavoriteClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     e.preventDefault();
//     onToggleFavorite(service.id);
//   };

//   return (
//     <div className="block group relative cursor-pointer" onClick={() => onBookClick(service)}>
//       <Card className="overflow-hidden bg-white border-0 shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
//         <CardContent className="p-4 sm:p-6">
//           <div className="flex items-start gap-4">
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-semibold text-indigo-600 truncate">{company?.name ?? "Unknown Company"}</p>
//               <h3 className="text-lg font-bold truncate mt-1">{service.name}</h3>
//               <p className="text-sm text-slate-500 mt-1">
//                 Code:{" "}
//                 <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{service.code}</span>
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
//             <div className="flex items-center gap-1.5">
//               <Clock className="w-4 h-4" />
//               <span>{service.estimatedWaitTime} min wait</span>
//             </div>
//             <div className="font-bold text-slate-800 text-base">{service.price}</div>
//           </div>
//         </CardContent>
//       </Card>
//       <button onClick={handleFavoriteClick} className="absolute top-3 right-3 p-2 rounded-full bg-white/60 backdrop-blur-sm text-slate-500 hover:text-red-500 transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
//         <Heart className={`w-5 h-5 transition-all ${isFavorite ? "text-red-500 fill-current" : ""}`} />
//       </button>
//     </div>
//   );
// };


// // --- Main Logic Component: Combines Filtering, Listing, and Modal Handling ---
// const FilteredServiceList = () => {
//   const searchParams = useSearchParams();
//   const initialQuery = searchParams.get("q") || "";
  
//   // --- STATE MANAGEMENT ---
//   const { favorites, toggleFavorite } = useFavorites();
  
//   // State for the filter values from FilterNav
//   const [activeFilters, setActiveFilters] = useState<FilterState>({
//     searchTerm: initialQuery,
//     location: null,
//     categoryId: null,
//     showNoQueue: false,
//     isFavorite: false,
//   });

//   // State for the booking modal
//   const [selectedService, setSelectedService] = useState<Service | null>(null);
//   const [modalStep, setModalStep] = useState<'details' | 'form'>('details');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [category, setCategory] = useState<string | null>(null);
//   // --- DERIVED DATA & MEMOIZATION ---

//   // The core filtering logic, now powered by `activeFilters`
//   const filteredServices = useMemo(() => {
//     const companyMap = new Map<string, Company>(mockCompanies.map(c => [c.id, c]));

//     return mockServices.filter(service => {
//       const company = companyMap.get(service.companyId);

//       const searchTerm = activeFilters.searchTerm.toLowerCase();
//       const searchTermMatch = activeFilters.searchTerm
//         ? service.name.toLowerCase().includes(searchTerm) ||
//           service.code.toLowerCase().includes(searchTerm) ||
//           (company && company.name.toLowerCase().includes(searchTerm))
//         : true;

//       const categoryMatch = activeFilters.categoryId
//         ? service.categoryId === activeFilters.categoryId
//         : true;

//       // TODO: Replace with your actual queue count logic for each service
//       const queueCount = 0; 
//       const noQueueMatch = activeFilters.showNoQueue ? queueCount === 0 : true;

//       const favoriteMatch = activeFilters.isFavorite
//         ? favorites.includes(service.id)
//         : true;
      
//       // Placeholder for future location-based filtering
//       const locationMatch = true; 

//       return searchTermMatch && categoryMatch && noQueueMatch && favoriteMatch && locationMatch;
//     });
//   }, [activeFilters, favorites]);
  
//   const selectedCompany = useMemo(() => {
//     if (!selectedService) return undefined;
//     return mockCompanies.find(c => c.id === selectedService.companyId);
//   }, [selectedService]);

//   // --- MODAL HANDLER FUNCTIONS ---
//   const handleOpenBookingModal = (service: Service) => {
//     setModalStep("details");
//     setSelectedService(service);
//   };
//   const handleProceedToForm = () => setModalStep("form");
//   const handleCloseModal = () => setSelectedService(null);

//   const handleBookingSubmit = (data: BookingData) => {
//     setIsSubmitting(true);
//     setTimeout(() => {
//       setIsSubmitting(false);
//       handleCloseModal();
//       toast.success(`Successfully joined queue for ${selectedService?.name}!`);
//     }, 1500);
//   };

//   return (
//     <>
//       {/* 1. The Reusable FilterNav Component */}
//       <div className="mb-8">
//         <FilterNav onCategoryChange={setCategory} />
//       </div>

//       {/* 2. Results Header and List */}
//       <h2 className="text-2xl font-bold mb-4">
//         {filteredServices.length} Services Found
//       </h2>

//       {filteredServices.length > 0 ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredServices.map((service) => (
//             <SearchResultCard
//               key={service.id}
//               service={service}
//               company={mockCompanies.find(c => c.id === service.companyId)}
//               isFavorite={favorites.includes(service.id)}
//               onToggleFavorite={toggleFavorite}
//               onBookClick={handleOpenBookingModal}
//             />
//           ))}
//         </div>
//       ) : (
//         <div className="text-center py-20 bg-white rounded-lg shadow-sm border">
//           <Search className="mx-auto h-12 w-12 text-slate-400" />
//           <h3 className="mt-4 text-lg font-semibold text-slate-800">No Services Found</h3>
//           <p className="mt-1 text-sm text-slate-600">Try adjusting your filters to find what you're looking for.</p>
//         </div>
//       )}

//       {/* 3. The Booking Dialog (Modal) */}
//       <Dialog open={!!selectedService} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
//         <DialogContent className="sm:max-w-lg p-0">
//           {selectedService && (
//             modalStep === "details" ? (
//               <ServiceDetailView
//                 service={selectedService}
//                 company={selectedCompany}
//                 onJoinQueue={handleProceedToForm}
//               />
//             ) : (
//               <BookingForm
//                 service={selectedService}
//                 onSubmit={handleBookingSubmit}
//                 isSubmitting={isSubmitting}
//               />
//             ))}
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// // --- The Main Page Component (Wrapper) ---
// export default function UserServicesPage() {
//   return (
//     <div className="min-h-screen bg-slate-50">
//       <Toaster position="top-center" reverseOrder={false} />
//       <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
//         <Suspense fallback={<div>Loading...</div>}>
//           <FilteredServiceList />
//         </Suspense>
//       </div>
//     </div>
//   );
// }