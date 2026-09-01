"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

export interface ConfirmModalState {
  open: boolean;
  type: "leave_queue" | "cancel_booking";
  id: string | number;
  title: string;
  subtitle?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface Props {
  state: ConfirmModalState | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ state, loading, onClose, onConfirm }: Props) {
  if (!state) return null;

  const isQueue = state.type === "leave_queue";

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 p-0 overflow-hidden">
        {/* Top Header Card */}
        <div className="bg-gradient-to-b from-rose-50/80 via-rose-50/30 to-white dark:from-rose-950/30 dark:via-slate-900/40 dark:to-slate-900 px-6 pt-6 pb-4 text-center">
          <DialogHeader className="flex flex-col items-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 shadow-xs">
              <Icon
                icon={isQueue ? "solar:exit-bold-duotone" : "solar:calendar-cross-bold-duotone"}
                className="w-7 h-7"
              />
            </div>

            <DialogTitle className="font-serif font-bold text-xl sm:text-2xl text-slate-900 dark:text-white">
              {state.title}
            </DialogTitle>

            {state.subtitle && (
              <p className="text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-400 mt-1">
                {state.subtitle}
              </p>
            )}

            <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 px-2 leading-relaxed">
              {state.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {state.cancelLabel || "Keep"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="flex-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-full font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Processing…</span>
                </>
              ) : (
                <span>{state.confirmLabel || (isQueue ? "Yes, Leave Queue" : "Yes, Cancel Booking")}</span>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
