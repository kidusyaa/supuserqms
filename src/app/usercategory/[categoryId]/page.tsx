import { getCategoryWithServices } from "@/lib/supabase-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from '@iconify/react';

interface CategoryPageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { categoryId } = await params;
  const categoryData = await getCategoryWithServices(categoryId);

  if (!categoryData) {
    notFound();
  }

  const { services, ...category } = categoryData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              {category.icon ? (
                <Icon 
                  icon={category.icon} 
                  width="32" 
                  height="32" 
                  className="text-amber-600"
                />
              ) : (
                <Icon 
                  icon="material-symbols:category-outline" 
                  width="32" 
                  height="32" 
                  className="text-amber-600"
                />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="text-gray-600 mt-2">{category.description}</p>
              )}
            </div>
          </div>
          
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-amber-600 transition-colors">
              Home
            </Link>
            <Icon icon="material-symbols:chevron-right" width="16" height="16" />
            <Link href="/usercategory" className="hover:text-amber-600 transition-colors">
              Categories
            </Link>
            <Icon icon="material-symbols:chevron-right" width="16" height="16" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>

        {/* Services Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Services ({services.length})
          </h2>
          
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/booking/${service.id}?companyId=${service.company_id}`}
                  className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 hover:border-amber-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700 transition-colors duration-200 mb-1">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {service.company?.name || 'Unknown Company'}
                      </p>
                    </div>
                    <div className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {service.code}
                    </div>
                  </div>
                  
                  {service.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {service.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Icon icon="material-symbols:schedule" width="16" height="16" />
                      <span>{service.estimated_wait_time_mins || 'N/A'} min</span>
                    </div>
                    <div className="text-lg font-bold text-amber-600">
                      ${service.price || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 group-hover:bg-amber-200 transition-colors duration-200">
                      <Icon icon="material-symbols:arrow-forward" width="16" height="16" className="mr-1" />
                      Book Service
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <Icon 
                icon="material-symbols:room-service-outline" 
                width="64" 
                height="64" 
                className="text-gray-400 mx-auto mb-4"
              />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services available</h3>
              <p className="text-gray-600 mb-4">This category doesn't have any active services yet.</p>
              <Link
                href="/services"
                className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200"
              >
                <Icon icon="material-symbols:search" width="20" height="20" className="mr-2" />
                Browse All Services
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
