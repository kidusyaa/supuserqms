"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { X, Trash2 } from "lucide-react";
import type { Service } from "@/type";

interface Props {
  open: boolean;
  onClose: () => void;
  savedServices: Service[];
  onRemove: (serviceId: string) => void;
}

export function SavedServicesDrawer({ open, onClose, savedServices, onRemove }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Icon icon="solar:bookmark-bold" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                Saved Services
              </h3>
              <p className="text-xs text-slate-400">
                {savedServices.length} {savedServices.length === 1 ? "service" : "services"} in your favorites
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Services List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
          {savedServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                <Icon icon="solar:bookmark-linear" className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                No saved services yet
              </p>
              <p className="text-xs text-slate-400 max-w-xs mt-1 mb-5">
                Click the heart icon on any service card across GizeBook to save it for quick booking.
              </p>
              <Link
                href="/services"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-black transition-all"
              >
                Browse Services
              </Link>
            </div>
          ) : (
            savedServices.map((service) => {
              const photo = service.photo || service.service_photos?.[0]?.url;
              return (
                <div key={service.id} className="pt-4 first:pt-0 flex items-center justify-between gap-3">
                  <Link
                    href={`/booking/${service.id}${service.company_id ? `?companyId=${service.company_id}` : ""}`}
                    onClick={onClose}
                    className="flex items-center gap-3.5 flex-1 min-w-0 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0">
                      {photo ? (
                        <Image src={photo} alt={service.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Icon icon="solar:sparkles-linear" className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 truncate transition-colors">
                        {service.name}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {service.company?.name || "Verified Salon"}
                      </p>
                      <p className="text-xs font-black text-slate-900 dark:text-white mt-1">
                        {service.price} ETB
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => onRemove(service.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
                    title="Remove from favorites"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {savedServices.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Link
              href="/services"
              onClick={onClose}
              className="w-full bg-[#FBA819] hover:bg-amber-500 active:bg-amber-600 text-slate-950 py-3 rounded-full font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <span>Explore more services</span>
              <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
