// app/search/page.tsx
"use client";

// ... other imports
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import React, { useMemo, Suspense } from 'react';

// Import our new hook and the Heart icon
import { useFavorites } from '@/hooks/useFavorites';
import { Heart } from 'lucide-react';

// ... other imports (mock data, types, Card, etc.)
import { mockServices } from '@/components/data/services';
import { mockCompanies } from '@/components/data/company';
import { Service, Company } from '@/type';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Tag } from "lucide-react";

// --- UPDATE SearchResultCard ---
const SearchResultCard = ({
  service,
  company,
  isFavorite,
  onToggleFavorite,
}: {
  service: Service;
  company?: Company;
  isFavorite: boolean;
  onToggleFavorite: (serviceId: string) => void;
}) => {

  const handleFavoriteClick = (e: React.MouseEvent) => {
    // These two lines are crucial! They stop the click from
    // triggering the Link navigation around the card.
    e.stopPropagation();
    e.preventDefault();
    onToggleFavorite(service.id);
  };

  return (
    // Add `group` and `relative` to the Link for styling the button
    <Link href={`/userservice/${service.id}`} className="block group relative">
      <Card className="overflow-hidden bg-white border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-indigo-600 truncate">{company?.name ?? 'Unknown Company'}</p>
              <h3 className="text-lg font-bold truncate mt-1">{service.name}</h3>
              <p className="text-sm text-slate-500 mt-1">
                Service Code: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{service.code}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{service.estimatedWaitTime} min wait</span>
            </div>
            <div className="font-bold text-slate-800 text-base">
              {service.price}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* The Favorite Button */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 p-2 rounded-full bg-white/50 backdrop-blur-sm text-slate-500 hover:text-red-500 transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          className={`w-5 h-5 transition-all ${isFavorite ? 'text-red-500 fill-current' : ''}`}
        />
      </button>
    </Link>
  );
};

// --- UPDATE SearchResults ---
const SearchResults = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
  // Use our custom hook here!
  const { favorites, toggleFavorite } = useFavorites();

  const filteredServices = useMemo(() => {
    // ... your existing filtering logic is fine, no changes needed here
    if (!query) return [];
    const lowerCaseQuery = query.toLowerCase().trim();
    const companyMap = new Map<string, Company>(mockCompanies.map(c => [c.id, c]));
    return mockServices.filter(service => {
      const company = companyMap.get(service.companyId);
      const serviceNameMatch = service.name.toLowerCase().includes(lowerCaseQuery);
      const serviceCodeMatch = service.code.toLowerCase().includes(lowerCaseQuery);
      const companyNameMatch = company ? company.name.toLowerCase().includes(lowerCaseQuery) : false;
      return serviceNameMatch || serviceCodeMatch || companyNameMatch;
    });
  }, [query]);

  // ... rest of the component (if !query, return...)
  if (!query) {
    // ... no change
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Search Results</h1>
      <p className="text-slate-600 mb-8">
        Found <span className="font-bold text-indigo-600">{filteredServices.length}</span> results for <span className="font-bold text-slate-800">“{query}”</span>
      </p>

      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-amber-200 p-2">
          {filteredServices.map(service => {
            const company = mockCompanies.find(c => c.id === service.companyId);
            // Check if the current service is in our favorites list
            const isFavorite = favorites.includes(service.id);
            
            return (
              <SearchResultCard
                key={service.id}
                service={service}
                company={company}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite} // Pass the function down
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <Tag className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">No results found</h3>
          <p className="mt-1 text-sm text-slate-600">Try searching for something else.</p>
        </div>
      )}
    </div>
  );
};

// --- NO CHANGE NEEDED for SearchPage component ---
export default function SearchPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <Suspense fallback={<div>Loading...</div>}>
                    <SearchResults />
                </Suspense>
            </div>
        </div>
    );
}