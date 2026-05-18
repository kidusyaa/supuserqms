// profile/_components/RatingModal.tsx
"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Label }    from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { StarRating, RATING_LABELS } from "./Starrating";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";

import type { UpsertRatingPayload } from "../_api/rating";

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
  const [stars, setStars]   = useState(state.existing?.stars ?? 0);
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
      <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl bg-white p-0 overflow-hidden">
        {/* Warm header */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Rate your experience</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-0.5">
              How was your visit to{" "}
              <span className="font-semibold text-gray-700">{state.companyName}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col items-center gap-2 py-2">
            <StarRating value={stars} onChange={setStars} size="lg" />
            <div className="h-6 flex items-center">
              {stars > 0 && (
                <span className={`text-sm font-semibold tracking-wide uppercase ${label?.color}`}>
                  {label?.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        {/* <div className="px-6 pb-6 pt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-600">
              Write a review <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share details about your experience…"
              rows={3}
              maxLength={500}
              className="resize-none rounded-xl border-gray-200 focus:border-amber-400 focus:ring-amber-400/20 text-sm"
            />
            <p className="text-xs text-gray-400 text-right">{review.length}/500</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={saving || stars === 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold border-0 shadow-md shadow-amber-200"
            >
              {saving ? "Saving…" : state.existing ? "Update Rating" : "Submit Rating"}
            </Button>
            <Button variant="outline" onClick={onClose} className="rounded-xl border-gray-200">
              Cancel
            </Button>
          </div>
        </div> */}
      </DialogContent>
    </Dialog>
  );
}