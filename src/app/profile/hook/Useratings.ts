
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { fetchMyRatings,  insertRating,
  updateRating,
  buildRatingsMap,
  type CompanyRating,
  type RatingSourceType,
  type UpsertRatingPayload, } from "../_api/rating";

export type { CompanyRating, RatingSourceType };

export function useRatings() {
  const [ratingsMap, setRatingsMap] = useState<Record<string, CompanyRating>>({});
  const [loadingRatings, setLoadingRatings] = useState(false);

  // ── Load all ratings for the signed-in user ─────────────────────
  const loadRatings = useCallback(async () => {
    setLoadingRatings(true);
    try {
      const list = await fetchMyRatings();
      setRatingsMap(buildRatingsMap(list));
    } catch (e: any) {
      console.warn("[useRatings] load error:", e?.message);
    } finally {
      setLoadingRatings(false);
    }
  }, []);

  // ── Get a single rating by source key ───────────────────────────
  const getRating = useCallback(
    (sourceType: RatingSourceType, sourceId: string): CompanyRating | null =>
      ratingsMap[`${sourceType}:${sourceId}`] ?? null,
    [ratingsMap]
  );

  // ── Save (insert or update) a rating ────────────────────────────
  const saveRating = useCallback(
    async (
      payload: UpsertRatingPayload,
      existing: CompanyRating | null
    ): Promise<boolean> => {
      try {
        let saved: CompanyRating;

        if (existing) {
          saved = await updateRating(existing.id, payload.stars, payload.review);
        } else {
          saved = await insertRating(payload);
        }

        setRatingsMap((prev) => ({
          ...prev,
          [`${saved.source_type}:${saved.source_id}`]: saved,
        }));

        toast.success(existing ? "Rating updated!" : "Thanks for your feedback!");
        return true;
      } catch (e: any) {
        toast.error(e?.message || "Failed to save rating.");
        return false;
      }
    },
    []
  );

  return { ratingsMap, loadingRatings, loadRatings, getRating, saveRating };
}