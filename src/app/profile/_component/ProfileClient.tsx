// profile/ProfileClient.tsx  — orchestration shell only
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  getAuthUserOrNull,
  getAvatars,
  getMyBookings,
  getMyProfileOrNull,
  getMyQueueEntries,
  isProfileComplete,
  upsertMyProfile,
  type UserProfile,
} from "@/lib/supabase-utils";

import { useRatings, type RatingSourceType, type CompanyRating } from "../hook/Useratings";
import { ActivityTabs } from "./Activitytabs";
import { ProfileEditDrawer } from "./Profileeditdrawer";
import { ProfileHero } from "./Profilehero";
import { RatingModal, type RatingModalState } from "./Ratingmodal";
import type { Booking, QueueItem } from "@/type";

export default function ProfileClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const nextUrl      = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  // ── State ────────────────────────────────────────────────────────
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [avatarId, setAvatarId]       = useState<string | null>(null);
  const [avatars, setAvatars]         = useState<{ id: string; url: string }[]>([]);
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueItem[]>([]);
  const [ratingModal, setRatingModal] = useState<RatingModalState | null>(null);

  const { ratingsMap, loadRatings, saveRating } = useRatings();

  // ── Derived ──────────────────────────────────────────────────────
  const avatarUrl = useMemo(() => {
    if (!avatarId) return null;
    return avatars.find((a) => a.id === avatarId)?.url
        ?? avatars.find((a) => a.url?.endsWith(`/avatars/${avatarId}`))?.url
        ?? null;
  }, [avatarId, avatars]);

  const totalRatings = useMemo(() => Object.keys(ratingsMap).length, [ratingsMap]);

  // ── Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = await getAuthUserOrNull();
        if (!user) {
          router.push(`/auth?next=${encodeURIComponent("/profile?next=" + encodeURIComponent(nextUrl))}`);
          return;
        }
        const [p, a] = await Promise.all([getMyProfileOrNull(), getAvatars()]);
        setAvatars(a);
        if (p) {
          setProfile(p);
          setName(p.name || "");
          setPhone(p.phone_number || "");
          setAvatarId(p.avatar_id || null);
        }
        try {
          const [b, q] = await Promise.all([getMyBookings(), getMyQueueEntries()]);
          setBookings(b);
          setQueueEntries(q);
          await loadRatings();
        } catch (e: any) {
          console.warn("Activity load error:", e?.message);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, nextUrl, loadRatings]);

  // ── Save profile ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await upsertMyProfile({
        name: name.trim(),
        phone_number: phone.trim(),
        avatar_id: avatarId,
      });
      setProfile(updated);
      setDrawerOpen(false);
      toast.success("Profile updated.");
      if (isProfileComplete(updated) && searchParams.get("next")) {
        router.push(nextUrl);
      }
    } catch (e: any) {
      if (e?.code === "AUTH_REQUIRED") {
        router.push(`/auth?next=${encodeURIComponent("/profile?next=" + encodeURIComponent(nextUrl))}`);
        return;
      }
      toast.error(e?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Rating modal ─────────────────────────────────────────────────
  const handleRateClick = useCallback((
    sourceType: RatingSourceType,
    sourceId: string,
    companyId: string,
    companyName: string,
    existing: CompanyRating | null,
  ) => {
    setRatingModal({ open: true, sourceType, sourceId, companyId, companyName, existing });
  }, []);

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-white">
        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-5">

          {/* ── Hero ── */}
          <ProfileHero
            name={name || profile?.name || ""}
            email={profile?.email ?? null}
            avatarUrl={avatarUrl}
            totalBookings={bookings.length}
            totalQueue={queueEntries.length}
            totalRatings={totalRatings}
            onEditClick={() => setDrawerOpen(true)}
          />

          {/* ── Activity ── */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-sky-400 via-violet-400 to-purple-400" />
            <div className="px-5 py-4">
              <h2 className="text-base font-bold text-gray-900 mb-4">My Activity</h2>
              <ActivityTabs
                bookings={bookings}
                queueEntries={queueEntries}
                ratingsMap={ratingsMap}
                onRateClick={handleRateClick}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Edit drawer ── */}
      <ProfileEditDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        name={name}
        phone={phone}
        avatarId={avatarId}
        avatars={avatars}
        saving={saving}
        onNameChange={setName}
        onPhoneChange={setPhone}
        onAvatarChange={setAvatarId}
        onSave={handleSave}
      />

      {/* ── Rating modal ── */}
      {ratingModal && (
        <RatingModal
          state={ratingModal}
          onClose={() => setRatingModal(null)}
          saveRating={saveRating}
        />
      )}
    </>
  );
}