/**
 * profile/api/ratings.ts
 * ─────────────────────────────────────────────
 * All Supabase calls related to company ratings.
 * No UI imports — pure data layer.
 */

import { supabase } from "@/lib/supabaseClient";

export type RatingSourceType = "booking" | "queue";

export interface CompanyRating {
  id: string;
  company_id: string;
  user_id: string;
  source_type: RatingSourceType;
  source_id: string;
  stars: number;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertRatingPayload {
  company_id: string;
  source_type: RatingSourceType;
  source_id: string;
  stars: number;
  review?: string | null;
}

// ── Fetch all ratings for the current user ──────────────────────────
export async function fetchMyRatings(): Promise<CompanyRating[]> {

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("company_ratings")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("[ratings] fetchMyRatings error:", error.message);
    return [];
  }
  return (data ?? []) as CompanyRating[];
}

// ── Insert a new rating ─────────────────────────────────────────────
export async function insertRating(
  payload: UpsertRatingPayload
): Promise<CompanyRating> {


  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("company_ratings")
    .insert({
      ...payload,
      user_id: user.id,
      review: payload.review?.trim() || null,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  return data as CompanyRating;
}

// ── Update an existing rating ───────────────────────────────────────
export async function updateRating(
  id: string,
  stars: number,
  review?: string | null
): Promise<CompanyRating> {


  const { data, error } = await supabase
    .from("company_ratings")
    .update({
      stars,
      review: review?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Update failed");
  return data as CompanyRating;
}

// ── Build a lookup map keyed by "sourceType:sourceId" ───────────────
export function buildRatingsMap(
  ratings: CompanyRating[]
): Record<string, CompanyRating> {
  return Object.fromEntries(
    ratings.map((r) => [`${r.source_type}:${r.source_id}`, r])
  );
}