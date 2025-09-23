import { getAllCategories } from "@/lib/supabase-utils";
import Link from "next/link";
import { Icon } from '@iconify/react';

export default async function UserCategoryPage() {
  const categories = await getAllCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Service Categories</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse services by category to find exactly what you're looking for
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/usercategory/${category.id}`}
              className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 hover:border-amber-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors duration-200">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors duration-200">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {category.description}
                  </p>
                )}
                {category.services && (
                  <div className="mt-3 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    {category.services} services
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Icon 
              icon="material-symbols:category-outline" 
              width="64" 
              height="64" 
              className="text-gray-400 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Check back later for available service categories.</p>
          </div>
        )}
      </div>
    </div>
  );
}
