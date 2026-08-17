import type { Metadata } from "next";
import PackageCard from "@/components/PackageCard";
import { getAllPackages } from "@/lib/api";
import { Package, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Service Packages & Bundles | GizeBook",
  description: "Browse special beauty, barbershop, spa & wellness service packages and bundles with exclusive discounts.",
  alternates: { canonical: "/packages" },
};

export default async function PackagesPage() {
  const packages = await getAllPackages();

  return (
    <main className="min-h-screen bg-slate-50/60 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Hero Banner */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Special Bundles & Discounts
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Service Packages
          </h1>
          <p className="text-slate-600 text-base mt-2">
            Save time and money by booking all-in-one treatment packages crafted by top salons and barbershops.
          </p>
        </div>

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No Packages Available</h3>
            <p className="text-slate-500 text-sm mt-1">
              Check back soon for new service packages and special offers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} service={pkg} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
