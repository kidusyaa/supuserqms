import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPackageById, formatPackageCategories } from "@/lib/api";
import {
  Package,
  Clock,
  Building,
  MapPin,
  CheckCircle2,
  Zap,
  ArrowLeft,
  Plus,
  Tag
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pkg = await getPackageById(id);
  if (!pkg) {
    return { title: "Package Not Found" };
  }
  return {
    title: `${pkg.name} | Service Package`,
    description: pkg.description || `Book the ${pkg.name} package deal.`,
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await getPackageById(id);

  if (!pkg) {
    notFound();
  }

  // Discount math
  const originalPriceNum = parseFloat(pkg.price || "0");
  const hasDiscount = !!(pkg.discount_type && pkg.discount_value && originalPriceNum > 0);
  let discountedPriceNum = originalPriceNum;
  if (hasDiscount) {
    if (pkg.discount_type === "percentage") {
      discountedPriceNum = originalPriceNum * (1 - pkg.discount_value! / 100);
    } else if (pkg.discount_type === "fixed") {
      discountedPriceNum = Math.max(0, originalPriceNum - pkg.discount_value!);
    }
  }

  let discountLabel = "";
  if (hasDiscount) {
    if (pkg.discount_type === "percentage") {
      discountLabel = `${Math.round(pkg.discount_value!)}% OFF`;
    } else if (pkg.discount_type === "fixed") {
      discountLabel = `-$${pkg.discount_value} OFF`;
    }
  }

  const categoriesSubtitle = formatPackageCategories(pkg);

  // Total duration
  const totalDurationMins = pkg.estimated_wait_time_mins || 
    pkg.included_services?.reduce((acc, sub) => acc + (sub.estimated_wait_time_mins || 0), 0) || 0;

  return (
    <main className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/packages"
            className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Packages
          </Link>
        </div>

        {/* Main Package Header Card */}
        <div className="bg-[#f4f7fc] border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-700 border border-amber-500/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  <Package className="w-3.5 h-3.5 text-amber-500" /> Package Deal
                </span>

                {hasDiscount && discountLabel && (
                  <span className="bg-amber-500 text-white text-xs font-extrabold px-3 py-1 rounded-lg shadow-xs">
                    {discountLabel}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {pkg.name}
              </h1>

              {categoriesSubtitle && (
                <p className="text-slate-600 text-base sm:text-lg font-semibold">
                  {categoriesSubtitle}
                </p>
              )}

              {pkg.company && (
                <div className="flex items-center gap-4 text-sm text-slate-500 pt-1 flex-wrap">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{pkg.company.name}</span>
                  </div>
                  {pkg.company.location_text && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{pkg.company.location_text}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Price Box */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:w-64 text-center space-y-3 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Package Price
              </span>
              <div className="flex items-baseline justify-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                  ${discountedPriceNum.toFixed(0)}
                </span>
                {hasDiscount && originalPriceNum > discountedPriceNum && (
                  <span className="line-through text-slate-400 text-base font-normal ml-2">
                    ${originalPriceNum.toFixed(0)}
                  </span>
                )}
              </div>

              {totalDurationMins > 0 && (
                <div className="inline-flex items-center justify-center gap-1.5 text-slate-600 text-xs font-semibold bg-slate-100 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{totalDurationMins} min estimated duration</span>
                </div>
              )}

              <Link
                href={`/booking/${pkg.id}`}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-base py-3 px-4 rounded-xl shadow-sm transition-colors inline-flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400" /> Book Package Now
              </Link>
            </div>
          </div>

          {pkg.description && (
            <div className="mt-6 pt-6 border-t border-slate-200/80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                About this Package
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {pkg.description}
              </p>
            </div>
          )}
        </div>

        {/* Included Services Breakdown */}
        {pkg.included_services && pkg.included_services.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Included Services ({pkg.included_services.length})
              </h2>
            </div>

            <div className="space-y-3">
              {pkg.included_services.map((sub, index) => (
                <div key={sub.id || index} className="relative">
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-slate-200">
                          {sub.service_category?.name || "Service Category"}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {sub.name}
                      </h3>
                      {sub.description && (
                        <p className="text-slate-500 text-xs line-clamp-2">
                          {sub.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-right sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      {sub.estimated_wait_time_mins != null && sub.estimated_wait_time_mins > 0 && (
                        <div className="text-xs text-slate-500 font-medium">
                          <div className="flex items-center gap-1 justify-end">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>{sub.estimated_wait_time_mins} min</span>
                          </div>
                        </div>
                      )}
                      {sub.price && (
                        <div className="text-base font-bold text-slate-900 min-w-[60px]">
                          ${parseFloat(sub.price).toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {index < (pkg.included_services?.length ?? 0) - 1 && (
                    <div className="flex justify-center my-1.5">
                      <div className="bg-amber-100 text-amber-700 rounded-full p-1 border border-amber-200">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-amber-950 text-white rounded-3xl p-8 text-center space-y-4 shadow-md">
          <h2 className="text-2xl font-bold">Ready to experience this package?</h2>
          <p className="text-slate-300 text-sm max-w-lg mx-auto">
            Book now to reserve your spot and enjoy the complete package treatment with instant confirmation.
          </p>
          <div>
            <Link
              href={`/booking/${pkg.id}`}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base py-3 px-8 rounded-xl transition-all shadow-md inline-flex items-center gap-2"
            >
              <Zap className="w-5 h-5 fill-slate-950" /> Reserve Package Deal
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
