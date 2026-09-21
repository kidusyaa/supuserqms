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
  Phone,
  MessageCircle,
} from "lucide-react";
import { calculateItemPriceBreakdown } from "@/lib/supabase-utils";

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

  // 1. Calculate sum of individual items if available
  let individualSum = 0;
  if (pkg.package_items && pkg.package_items.length > 0) {
    for (const item of pkg.package_items) {
      if (item.item_type === 'service') {
        const p = item.linked_variant?.price || item.linked_service?.price;
        if (p) individualSum += parseFloat(String(p)) || 0;
      }
    }
  } else if (pkg.included_services && pkg.included_services.length > 0) {
    for (const sub of pkg.included_services) {
      if (sub.price) individualSum += parseFloat(sub.price) || 0;
    }
  }

  // 2. Price and Discount math
  const priceBreakdown = calculateItemPriceBreakdown(pkg);
  const isPriceVisible = !priceBreakdown.isCallForPrice;
  const originalPriceNum = priceBreakdown.originalPrice || individualSum || 0;
  const finalPriceNum = priceBreakdown.finalPrice ?? (originalPriceNum > 0 ? originalPriceNum : null);

  const struckThroughPrice =
    individualSum > 0 && finalPriceNum !== null && individualSum > finalPriceNum
      ? individualSum
      : priceBreakdown.hasDiscount && priceBreakdown.originalPrice && finalPriceNum !== null && priceBreakdown.originalPrice > finalPriceNum
      ? priceBreakdown.originalPrice
      : null;

  let discountLabel = "";
  if (pkg.discount_type === "percentage" && pkg.discount_value) {
    discountLabel = `Total ${Math.round(Number(pkg.discount_value))}% OFF`;
  } else if (pkg.discount_type === "fixed" && pkg.discount_value) {
    discountLabel = `Save ${pkg.discount_value} ETB`;
  } else if (struckThroughPrice && finalPriceNum && struckThroughPrice > finalPriceNum) {
    const saved = Math.round(struckThroughPrice - finalPriceNum);
    discountLabel = `Save ${saved} ETB`;
  }

  const categoriesSubtitle = formatPackageCategories(pkg);

  // Total duration
  const totalDurationMins =
    pkg.estimated_wait_time_mins ||
    pkg.included_services?.reduce((acc, sub) => acc + (sub.estimated_wait_time_mins || 0), 0) ||
    0;

  const phoneLink = pkg.company?.phone ? `tel:${pkg.company.phone}` : null;
  const telegramLink = pkg.company?.socials?.website?.includes("t.me")
    ? pkg.company.socials.website
    : null;

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

                {discountLabel && (
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
                {!isPriceVisible ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xl sm:text-2xl font-extrabold text-amber-600">
                      Contact for price
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                      {finalPriceNum?.toFixed(0)} ETB
                    </span>
                    {struckThroughPrice && finalPriceNum && struckThroughPrice > finalPriceNum && (
                      <span className="line-through text-slate-400 text-base font-normal">
                        {struckThroughPrice.toFixed(0)} ETB
                      </span>
                    )}
                  </div>
                )}
              </div>

              {totalDurationMins > 0 && (
                <div className="inline-flex items-center justify-center gap-1.5 text-slate-600 text-xs font-semibold bg-slate-100 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{totalDurationMins} min estimated duration</span>
                </div>
              )}

              {/* Action Buttons: If price not visible, offer Contact Venue */}
              {!isPriceVisible ? (
                <div className="space-y-2 pt-1">
                  {phoneLink && (
                    <a
                      href={phoneLink}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" /> Call to Inquire
                    </a>
                  )}
                  {telegramLink && (
                    <a
                      href={telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm py-2 px-4 rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Telegram
                    </a>
                  )}
                </div>
              ) : (
                <Link
                  href={`/booking/${pkg.id}`}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-base py-3 px-4 rounded-xl shadow-sm transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-amber-400" /> Book Package Now
                </Link>
              )}
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

        {/* ── Curated Package Inclusions Checklist ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Package Inclusions
            </h2>
          </div>

          {/* Render package_items if available */}
          {pkg.package_items && pkg.package_items.length > 0 ? (
            <div className="space-y-3">
              {pkg.package_items.map((item, index) => {
                const isCustom = item.item_type === 'custom' || !item.linked_service_id;
                const title = isCustom
                  ? item.custom_name
                  : item.linked_service?.name || item.custom_name || "Included Service";
                const variantName = item.linked_variant?.name || item.service_variant?.name;
                const categoryName = item.linked_service?.service_category?.name;
                const price = item.linked_variant?.price || item.linked_service?.price;

                return (
                  <div key={item.id || index} className="relative">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-slate-200">
                            {isCustom ? "Complimentary Perk" : categoryName || "Service"}
                          </span>
                          {variantName && (
                            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-md border border-amber-200">
                              {variantName}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          {title}
                        </h3>
                        {item.linked_service?.description && (
                          <p className="text-slate-500 text-xs line-clamp-2">
                            {item.linked_service.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        {item.linked_variant?.duration_mins || item.linked_service?.estimated_wait_time_mins ? (
                          <div className="text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-1 justify-end">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>
                                {item.linked_variant?.duration_mins || item.linked_service?.estimated_wait_time_mins} min
                              </span>
                            </div>
                          </div>
                        ) : null}
                        {price ? (
                          <div className="text-base font-bold text-slate-900 min-w-[60px]">
                            {parseFloat(String(price)).toFixed(0)} ETB
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {index < (pkg.package_items?.length ?? 0) - 1 && (
                      <div className="flex justify-center my-1.5">
                        <div className="bg-amber-100 text-amber-700 rounded-full p-1 border border-amber-200">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : pkg.included_services && pkg.included_services.length > 0 ? (
            /* Fallback to included_services */
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
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        {sub.name}
                      </h3>
                      {sub.description && (
                        <p className="text-slate-500 text-xs line-clamp-2">
                          {sub.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      {sub.estimated_wait_time_mins != null && sub.estimated_wait_time_mins > 0 && (
                        <div className="text-xs text-slate-500 font-medium">
                          <div className="flex items-center gap-1 justify-end">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>{sub.estimated_wait_time_mins} min</span>
                          </div>
                        </div>
                      )}
                      {sub.is_price_visible !== false && sub.price ? (
                        <div className="text-base font-bold text-slate-900 min-w-[60px]">
                          {parseFloat(sub.price).toFixed(0)} ETB
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-amber-600">
                          Contact for price
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
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <ul className="space-y-2.5">
                {pkg.description_points && pkg.description_points.length > 0 ? (
                  pkg.description_points.map((pt, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{pt}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Adona Refresh</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Wash and Style / Hair cut</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Seasonal fruit Juice</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-amber-950 text-white rounded-3xl p-8 text-center space-y-4 shadow-md">
          <h2 className="text-2xl font-bold">Ready to experience this package?</h2>
          <p className="text-slate-300 text-sm max-w-lg mx-auto">
            Book now to reserve your spot and enjoy the complete package treatment with instant confirmation.
          </p>
          <div>
            {!isPriceVisible && phoneLink ? (
              <a
                href={phoneLink}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base py-3 px-8 rounded-xl transition-all shadow-md inline-flex items-center gap-2"
              >
                <Phone className="w-5 h-5 text-slate-950" /> Contact Venue to Inquire
              </a>
            ) : (
              <Link
                href={`/booking/${pkg.id}`}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base py-3 px-8 rounded-xl transition-all shadow-md inline-flex items-center gap-2"
              >
                <Zap className="w-5 h-5 fill-slate-950" /> Reserve Package Deal
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
