import Link from "next/link";
import { Search, Clock, Users, ChevronRight, Zap, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockCategories } from "@/components/data/categories";

// ✨ 1. IMPORT THE CORRECT TYPE FROM YOUR CENTRAL TYPES FILE
import { ServiceWithDetails } from "@/type";
// The local definition of ServiceWithDetails is no longer needed.

// ✨ 2. UPDATE THE PROPS INTERFACE TO EXPECT THE DETAILED TYPE
interface CategoryViewProps {
  categoryId: string;
  services: ServiceWithDetails[]; // Use the detailed type
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearCategory: () => void;
}

/**
 * The view for displaying services within a specific category.
 */
export default function CategoryView({
  categoryId,
  services,
  searchQuery,
  onSearchChange,
  onClearCategory,
}: CategoryViewProps) {
  const category = mockCategories.find((c) => c.id === categoryId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ... Header is fine ... */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          {/* ... back button and title ... */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search in this category..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-white border-slate-200"
            />
          </div>
        </div>
      </header>

      {/* Services List */}
      <main className="container mx-auto max-w-4xl px-4 py-6">
        {services.length > 0 ? (
          <div className="space-y-4">
            {/* TypeScript now knows `service` is `ServiceWithDetails` */}
            {services.map((service) => (
              <Link key={service.id} href={`/service/${service.id}`} className="block">
                <Card className="group overflow-hidden bg-white border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-400">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-3xl">
                        {service.type === "Beauty" ? "✂️" : "🚗"}
                      </div>
                      {/* ✨ 3. UNCOMMENT AND USE THE DETAILED DATA */}
                      {service.queueCount === 0 && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                          <Zap className="w-3.5 h-3.5 text-white" fill="white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                      <div className="md:col-span-2">
                        <h3 className="font-semibold text-slate-800 truncate">{service.name}</h3>
                        {/* Use the company name from the detailed data */}
                        <p className="text-sm text-slate-500 truncate">{service.company?.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{service.estimatedWaitTime}min</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            {/* Use the queueCount from the detailed data */}
                            <span>{service.queueCount} in queue</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left md:text-right">
                        <div className="text-lg font-bold text-slate-900 mb-1">{service.price}</div>
                        {/* ✨ 4. UNCOMMENT AND USE THE DETAILED DATA */}
                        {service.queueCount === 0 ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">No Wait</Badge>
                        ) : (
                          <div className="hidden md:flex justify-end">
                            <ChevronRight className="w-6 h-6 text-slate-400 transition-transform group-hover:translate-x-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {/* ... No results view ... */}
          </div>
        )}
      </main>
    </div>
  );
}