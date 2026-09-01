"use client";

import { Icon } from "@iconify/react";
import type { Provider } from "@/type";
import { ANY_PROVIDER_ID } from "@/type";
import { cn } from "@/lib/utils";

interface ProviderSelectorProps {
  providers: Provider[];
  selectedProviderId: string;
  onSelectProvider: (id: string) => void;
  queueCountsByProvider?: Record<string, number>;
}

export default function ProviderSelector({
  providers,
  selectedProviderId,
  onSelectProvider,
  queueCountsByProvider = {},
}: ProviderSelectorProps) {
  const activeProviders = providers.filter((p) => p.is_active);

  // Synthesize "Any Provider"
  const anyProvider: Provider = {
    id: ANY_PROVIDER_ID,
    name: "Any Provider",
    specialization: "First available professional",
    is_active: true,
    company_id: providers[0]?.company_id || "",
    created_at: new Date().toISOString(),
    isAny: true,
  };

  // If only 1 provider exists, show only that provider directly.
  // If multiple providers (>=2) exist, synthesize "Any Provider" (Fastest / Least Queue) as the first choice.
  const displayProviders =
    activeProviders.length > 1
      ? [anyProvider, ...activeProviders]
      : activeProviders;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Icon icon="solar:user-hand-up-bold" className="w-4 h-4 text-amber-500" />
          <span>Select Specialist</span>
        </label>
        <span className="text-xs text-slate-400">
          {displayProviders.length} options available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {displayProviders.length > 0 ? (
          displayProviders.map((provider) => {
            const isSelected = selectedProviderId === provider.id;
            const pQueue = queueCountsByProvider[provider.id];

            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => onSelectProvider(provider.id)}
                className={cn(
                  "relative text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3",
                  isSelected
                    ? "bg-[#0f2937] text-white border-[#0f2937] shadow-sm ring-2 ring-[#0f2937]/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                {/* Avatar Squircle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
                    isSelected
                      ? "bg-white/15 text-amber-300"
                      : provider.isAny
                      ? "bg-amber-50 dark:bg-slate-800 text-amber-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {provider.isAny ? (
                    <Icon icon="solar:users-group-rounded-linear" className="w-5 h-5" />
                  ) : (
                    <Icon icon="solar:user-linear" className="w-5 h-5" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4
                      className={cn(
                        "font-bold text-sm truncate",
                        isSelected ? "text-white" : "text-slate-900 dark:text-white"
                      )}
                    >
                      {provider.name}
                    </h4>
                  </div>
                  <p
                    className={cn(
                      "text-xs truncate",
                      isSelected ? "text-slate-300" : "text-slate-400"
                    )}
                  >
                    {provider.specialization || "Professional"}
                  </p>
                </div>

                {/* Badge Tag */}
                {provider.isAny ? (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                      isSelected
                        ? "bg-amber-400 text-slate-900"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60"
                    )}
                  >
                    Fastest
                  </span>
                ) : pQueue !== undefined && pQueue > 0 ? (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {pQueue} in line
                  </span>
                ) : null}
              </button>
            );
          })
        ) : (
          <div className="col-span-full text-center py-6 text-slate-400 text-xs">
            No specialists currently assigned to this service.
          </div>
        )}
      </div>
    </div>
  );
}