"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Category } from "@/type";
import { useRouter } from "next/navigation";
import { getCategoriesWithServiceCounts } from "@/lib/api";
import DivCenter from "./divCenter";

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      const data = await getCategoriesWithServiceCounts();
      setCategories(data);
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-orange-500 font-semibold">
        Loading categories...
      </div>
    );
  }

  return (
    <div className=" min-h-screen py-12">
      <DivCenter>
        <div className="container mx-auto px-4">
          {/* Header */}
          <h1 className="text-4xl font-extrabold text-center mb-10 text-orange-600">
            Service Categories
          </h1>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/usercategory/${category.id}`}
                passHref
              >
                <div className="group block bg-white rounded-2xl border border-orange-200 shadow-md hover:shadow-xl hover:border-orange-400 transition-all duration-300 cursor-pointer overflow-hidden">
                  {/* Icon + Title */}
                  <div className="p-6 flex items-center gap-4">
                    <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-full bg-orange-100 text-4xl group-hover:bg-orange-200 transition-colors duration-300">
                      {category.icon}
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                        {category.name}
                      </h5>
                      <p className="text-gray-600 text-sm">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-orange-50 px-6 py-4 text-sm font-semibold text-orange-700 group-hover:bg-orange-100 transition-colors duration-300">
                    {category.services}{" "}
                    {category.services === 1 ? "service" : "services"} available
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </DivCenter>
    </div>
  );
}
