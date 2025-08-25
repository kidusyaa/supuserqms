"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Service, Category } from "@/type";
import { useRouter } from "next/navigation";
import { getServicesByCategory, getCategories } from "@/lib/api";
import { Clock, MapPin, Star, Users } from "lucide-react";
import DivCenter from "./divCenter";

interface ServicesByCategoryPageProps {
  categoryId: string;
}

export default function ServicesByCategoryPage({ categoryId }: ServicesByCategoryPageProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch services for this category
        const servicesData = await getServicesByCategory(categoryId);
        setServices(servicesData);

        // Fetch category details
        const categoriesData = await getCategories();
        const currentCategory = categoriesData.find(cat => cat.id === categoryId);
        setCategory(currentCategory || null);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-orange-500 font-semibold">
        Loading services...
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <DivCenter>
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2"
            >
              ← Back to Categories
            </button>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              {category?.name || 'Category'} Services
            </h1>
            <p className="text-gray-600 text-lg">
              {category?.description || 'Discover services in this category'}
            </p>
            <div className="mt-2 text-sm text-gray-500">
              {services.length} {services.length === 1 ? 'service' : 'services'} available
            </div>
          </div>

          {/* Services Grid */}
          {services.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No services found
              </h3>
              <p className="text-gray-500">
                There are currently no active services in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-orange-300">
                    {/* Service Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {service.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          service.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {service.description}
                      </p>

                      {/* Service Details */}
                      <div className="space-y-2">
                        {service.company_id && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>{service.company_id}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>~{service.estimated_wait_time_mins} min wait</span>
                        </div>

                        {service.providers && service.providers.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>{service.providers.length} provider{service.providers.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Service Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700">
                          Code: {service.code}
                        </div>
                        {service.price && (
                          <div className="text-sm font-bold text-orange-600">
                            {service.price}
                          </div>
                        )}
                      </div>
                      
                      {service.featureEnabled && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            <Star className="w-3 h-3" />
                            Featured
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DivCenter>
    </div>
  );
}
