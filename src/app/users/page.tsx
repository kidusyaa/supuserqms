"use client";
import { useState, useEffect } from 'react';
// Or your router of choice
import Link from 'next/link';
import { Category } from '@/type';

import { useRouter } from 'next/navigation';

import { getGlobalCategoriesWithServiceCounts } from '@/lib/firebase-utils';
// Example: Get your companyId from auth context or session


const ServiceCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

   useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      // 👇 Use the new function. No companyId needed!
      const data = await getGlobalCategoriesWithServiceCounts(); 
      setCategories(data);
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Service Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          // Use Link to make the whole card clickable
          <Link key={category.id} href={`/usercategory/${category.id}`} passHref>
            <div className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
              <div className="flex items-center mb-4">
                <span className="text-4xl mr-4">{category.icon}</span>
                <div>
                  <h5 className="text-2xl font-bold tracking-tight text-gray-900">
                    {category.name}
                  </h5>
                  <p className="font-normal text-gray-700">
                    {category.description}
                  </p>
                </div>
              </div>
               {/* Display the dynamic service count */}
              <p className="text-blue-600 font-semibold">
                {category.services} {category.services === 1 ? 'service' : 'services'} available
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ServiceCategoriesPage;