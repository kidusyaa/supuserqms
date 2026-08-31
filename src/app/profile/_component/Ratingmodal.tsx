"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarRating, RATING_LABELS } from "./Starrating";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { UpsertRatingPayload } from "../_api/rating";
import { Icon } from "@iconify/react";

export interface RatingModalState {
  open: boolean;
  sourceType: RatingSourceType;
  sourceId: string;
  companyId: string;
  companyName: string;
  existing: CompanyRating | null;
}

interface Props {
  state: RatingModalState;
  onClose: () => void;
  saveRating: (payload: UpsertRatingPayload, existing: CompanyRating | null) => Promise<boolean>;
}

export function RatingModal({ state, onClose, saveRating }: Props) {
  const [stars, setStars] = useState(state.existing?.stars ?? 0);
  const [review, setReview] = useState(state.existing?.review ?? "");
  const [saving, setSaving] = useState(false);
  const label = RATING_LABELS[stars];

  const handleSubmit = async () => {
    if (stars === 0) return;
    setSaving(true);
    const ok = await saveRating(
      {
        company_id: state.companyId,
        source_type: state.sourceType,
        source_id: state.sourceId,
        stars,
        review: review.trim(),
      },
      state.existing
    );
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 p-0 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-b from-amber-50/80 via-orange-50/30 to-white dark:from-slate-800 dark:to-slate-900 px-6 pt-6 pb-4 text-center">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-xl sm:text-2xl text-slate-900 dark:text-white">
              Rate your experience
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              How was your visit to{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {state.companyName}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          {/* Stars */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <StarRating value={stars} onChange={setStars} size="lg" />
            <div className="h-6 flex items-center justify-center">
              {stars > 0 && (
                <span className={`text-xs font-black tracking-wider uppercase ${label?.color || "text-amber-600"}`}>
                  {label?.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 pb-6 pt-2 space-y-4 text-left">
          {/* Review Textarea */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Write a review <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share details about the service, ambiance, or staff..."
              rows={3}
              maxLength={500}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none transition-all"
            />
            <p className="text-[11px] text-slate-400 text-right mt-1">
              {review.length}/500
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || stars === 0}
              className="flex-2 bg-[#FBA819] hover:bg-amber-500 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 py-3 px-6 rounded-full font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>Sending…</span>
                </>
              ) : (
                <>
                  <span>{state.existing ? "Update Rating" : "Send Rating"}</span>
                  <Icon icon="solar:star-fall-2-bold" className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}