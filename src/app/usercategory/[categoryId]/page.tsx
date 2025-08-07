"use client"; // Keep this!

import { useState, useEffect } from 'react';
// ❌ OLD (for Pages Router)
// import { useRouter } from 'next/router';

// ✅ NEW (for App Router)
import { useRouter, useParams } from 'next/navigation';

import { Service } from '@/type';
import { getAllServicesByCategory } from '@/lib/firebase-utils';
import Link from 'next/link';
const ServicesListPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter(); // This hook is for navigation (e.g., router.back())
  const params = useParams(); // This hook gets URL parameters

  // Get categoryId from the params object
  const categoryId = params.categoryId as string;

  useEffect(() => {
    // We already have the categoryId, so no need for 'typeof' check here
    if (categoryId) {
      const fetchServices = async () => {
        setIsLoading(true);
        const data = await getAllServicesByCategory(categoryId);
        setServices(data);
        setIsLoading(false);
      };

      fetchServices();
    }
  }, [categoryId]); // The dependency array is correct

  if (isLoading) {
    return <div>Loading services...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <button onClick={() => router.back()} className="mb-6 text-blue-600 hover:underline">
        ← Back to Categories
      </button>
      <h1 className="text-3xl font-bold mb-6">Services for {categoryId}</h1>
      
      {services.length === 0 ? (
        <p>No services found...</p>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            // ✅ WRAP THE CARD IN A LINK
            <Link 
              key={service.id}
              // URL: /services/[serviceId]
              // Query Param: ?companyId=[companyId]
              href={`/services/${service.id}?companyId=${service.companyId}`}
            >
              <div className="p-4 bg-white rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">{service.name}</h2>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {service.company?.name || 'Unknown Company'}
                    </span>
                </div>
                <p className="mt-2 font-semibold">Price: ${service.price}</p>
                <p className="text-sm text-gray-500">Service Code: {service.code}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesListPage;