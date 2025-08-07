"use client";

import Link from 'next/link';
import { Category } from '@/type';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';

// Define the type for the props we receive from the Server Component
interface CategoryWithCount extends Category {
  serviceCount: number;
}

interface HomePageClientProps {
  categories: CategoryWithCount[];
  // You could add featuredServices here later
}

export default function HomePageClient({ categories }: HomePageClientProps) {
  // This component is now very simple. It just receives data and displays it.
  // No more useState, useMemo, or complex filtering logic here.
  // Navigation handles showing the next view.

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto max-w-4xl px-4 py-6">
        
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Find a Service</h1>
          <p className="text-slate-600 mb-6">Select a category to see available services near you.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              // This link is the most important part. It navigates to the
              // dynamic page that will list the services for this category.
              <Link key={category.id} href={`/usercategory/${category.id}`} className="block">
                <Card className="group overflow-hidden bg-white border-slate-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="h-28 w-full overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" 
                    />
                  </div>
                  <CardContent className="p-3 text-center">
                    <p className="font-bold text-slate-800">{category.name}</p>
                    <Badge variant="secondary" className="mt-2">
                      {/* We display the REAL service count here! */}
                      {category.serviceCount} Services
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* You can add a section for "Featured Services" here later if you want */}

      </main>
    </div>
  );
}