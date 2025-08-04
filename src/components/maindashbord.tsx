"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Search, Clock, Users, Star, ChevronRight, Heart,
  Sparkles, Flame, ArrowRight, Bell, User
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockCategories } from "@/components/data/categories";
import { mockServices } from "@/components/data/services";
import { mockCompanies } from "@/components/data/company";
import { mockQueueItems } from "@/components/data/queueItem";
import { ServiceWithDetails } from "@/type";

interface MainDashboardProps {
  onSelectCategory: (categoryId: string) => void;
  featuredServices: ServiceWithDetails[];
}

export default function MainDashboard({
  onSelectCategory,
  featuredServices,
}: MainDashboardProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/userservices?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // ✨ 1. UPDATE THE CALCULATION LOGIC
  // This logic now correctly links services to categories using their IDs.
  const categoriesWithServiceCounts = mockCategories.map((category) => {
    const serviceCount = mockServices.filter(
      (service) => service.categoryId === category.id // ✨ CHANGE THIS LINE
    ).length;

    return {
      ...category,
      serviceCount: serviceCount,
    };
  });


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ... (rest of your header, search, and stats sections are fine) ... */}
        
        <header className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600">Good morning! 👋</p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                What are you looking for?
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
              </Button>
              <Link href="/my-queues">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="pb-16 space-y-12">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              placeholder="Search services, companies, or codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-12 text-base bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>

          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/70 p-4 text-center border-0 shadow-sm">
                <div className="text-2xl md:text-3xl font-bold text-indigo-600">
                  {mockServices.length}
                </div>
                <div className="text-sm text-slate-600">Services</div>
              </Card>
              <Card className="bg-white/70 p-4 text-center border-0 shadow-sm">
                <div className="text-2xl md:text-3xl font-bold text-green-600">
                  {mockCompanies.length}
                </div>
                <div className="text-sm text-slate-600">Companies</div>
              </Card>
              <Card className="bg-white/70 p-4 text-center border-0 shadow-sm">
                <div className="text-2xl md:text-3xl font-bold text-amber-500 flex items-center justify-center">
                  {Math.round(
                    mockServices.reduce(
                      (acc, s) => acc + s.estimatedWaitTime,
                      0
                    ) / mockServices.length
                  )}
                  <span className="text-lg">min</span>
                  <Star className="w-5 h-5 ml-1 fill-amber-400 text-amber-500" />
                </div>
                <div className="text-sm text-slate-600">Avg Wait</div>
              </Card>
              <Card className="bg-white/70 p-4 text-center border-0 shadow-sm">
                <div className="text-2xl md:text-3xl font-bold text-rose-500">
                  {mockQueueItems.filter((q) => q.status === "waiting").length}
                </div>
                <div className="text-sm text-slate-600">My Queues</div>
              </Card>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                Featured Services
              </h2>
              <Button variant="link" className="text-indigo-600 pr-0">
                See all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {featuredServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/usersservice/${service.id}`}
                  className="block flex-shrink-0 w-full max-w-xs sm:max-w-sm"
                >
                  <Card className="overflow-hidden bg-white border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl p-3 bg-slate-100 rounded-lg">
                          {service.type === "Beauty" ? "✂️" : "🚗"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {service.name}
                          </h3>
                          <p className="text-sm text-slate-600 truncate">
                            {service.company?.name ?? 'Unknown Company'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-end justify-between mt-4">
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{service.estimatedWaitTime}min</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>{service.queueCount} in queue</span>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-slate-800">
                          {service.price}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Browse Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* ✨ 2. This part now works correctly */}
              {categoriesWithServiceCounts.map((category) => (
                <Link key={category.id} href={`/usercategory/${category.id}`}>
                <Card
                  key={category.id}
                  className="relative overflow-hidden group cursor-pointer aspect-[4/3] flex flex-col justify-end p-4 text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
                  style={{
                    backgroundImage: `url(${category.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  onClick={() => onSelectCategory(category.id)}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="md:text-4xl mb-2">{category.icon}</div>
                    <h3 className="font-bold md:text-lg">{category.name}</h3>
                    <p className="text-sm opacity-90">
                      {category.serviceCount} services
                    </p>
                  </div>
                </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* ... (rest of your Quick Actions section is fine) ... */}

          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/users/my-queues">
                <Card className="group   bg-white border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:bg-indigo-50">
                  <div className="flex space-x-5 items-center  p-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        My Queues
                      </h3>
                      <p className="text-sm text-slate-600">
                        Track your current bookings
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 ml-auto transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
              <Link href="/favorites">
                <Card className="group  bg-white border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:bg-rose-50">
                  <div className="flex space-x-5 items-center  p-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Favorites
                      </h3>
                      <p className="text-sm text-slate-600">
                        Rebook your favorite services
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 ml-auto transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}