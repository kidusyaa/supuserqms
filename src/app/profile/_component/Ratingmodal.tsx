// profile/_components/RatingModal.tsx
"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StarRating, RATING_LABELS } from "./Starrating";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { UpsertRatingPayload } from "../_api/rating";
import { Sparkles, MessageSquare, ShieldAlert } from "lucide-react";

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
      { company_id: state.companyId, source_type: state.sourceType, source_id: state.sourceId, stars, review },
      state.existing
    );
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-0 overflow-hidden">
        {/* Glowing cyber gradient header */}
        <div className="bg-gradient-to-br from-slate-55/40 via-violet-50/10 to-cyan-50/10 dark:from-slate-950 dark:via-violet-950/20 dark:to-cyan-950/10 px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              Submit Experience Feedback
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Rate your services at <span className="font-bold text-slate-800 dark:text-slate-200">{state.companyName}</span> to sync customer feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex flex-col items-center gap-3 py-2 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
            <StarRating value={stars} onChange={setStars} size="lg" />
            <div className="h-6 flex items-center">
              {stars > 0 && (
                <span className={`text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/20 ${label?.color}`}>
                  {label?.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 pb-6 pt-5 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Write Review <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Describe your visit, service quality, wait time..."
              rows={3}
              maxLength={500}
              className="w-full min-h-[90px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-violet-500 focus:ring-violet-500/20 transition-all text-sm outline-none resize-none shadow-inner"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right font-mono">
              {review.length} / 500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={saving || stars === 0}
              className="flex-1 rounded-xl h-11 font-bold bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 hover:from-cyan-600 hover:via-violet-600 hover:to-amber-600 text-white border-0 shadow-md shadow-violet-500/10 cursor-pointer disabled:opacity-50 transition-all duration-300"
            >
              {saving ? "Saving Review…" : state.existing ? "Update Review" : "Submit Review"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-11 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 font-semibold cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}