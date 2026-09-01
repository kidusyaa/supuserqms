"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

import {
  getAuthUserOrNull,
  getAvatars,
  getMyBookings,
  getMyProfileOrNull,
  getMyQueueEntries,
  getMySavedServices,
  toggleServiceFavorite,
  isProfileComplete,
  upsertMyProfile,
  leaveQueue,
  cancelBooking,
  type UserProfile,
} from "@/lib/supabase-utils";

import { useRatings, type RatingSourceType, type CompanyRating } from "../hook/Useratings";
import { ActivityTabs } from "./Activitytabs";
import { ProfileEditDrawer } from "./Profileeditdrawer";
import { ProfileHero } from "./Profilehero";
import { SavedServicesDrawer } from "./SavedServicesDrawer";
import { RatingModal, type RatingModalState } from "./Ratingmodal";
import { ConfirmModal, type ConfirmModalState } from "./ConfirmModal";
import type { Booking, QueueItem, Service } from "@/type";

export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  // ── State ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<{ id: string; url: string }[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueItem[]>([]);
  const [savedServices, setSavedServices] = useState<Service[]>([]);
  const [ratingModal, setRatingModal] = useState<RatingModalState | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const { ratingsMap, loadRatings, saveRating } = useRatings();

  // ── Derived ──────────────────────────────────────────────────────
  const avatarUrl = useMemo(() => {
    if (!avatarId) return null;
    return (
      avatars.find((a) => a.id === avatarId)?.url ??
      avatars.find((a) => a.url?.endsWith(`/avatars/${avatarId}`))?.url ??
      null
    );
  }, [avatarId, avatars]);

  const totalRatings = useMemo(() => Object.keys(ratingsMap).length, [ratingsMap]);

  // ── Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = await getAuthUserOrNull();
        if (!user) {
          router.push(
            `/auth?next=${encodeURIComponent("/profile?next=" + encodeURIComponent(nextUrl))}`
          );
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
          const [b, q, saved] = await Promise.all([
            getMyBookings(),
            getMyQueueEntries(),
            getMySavedServices(),
          ]);
          setBookings(b);
          setQueueEntries(q);
          setSavedServices(saved);
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

  // ── Remove Saved Service ──────────────────────────────────────────
  const handleRemoveSaved = async (serviceId: string) => {
    try {
      await toggleServiceFavorite(serviceId);
      setSavedServices((prev) => prev.filter((s) => s.id !== serviceId));
      toast.success("Removed from saved services");
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove saved service");
    }
  };

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
        router.push(
          `/auth?next=${encodeURIComponent("/profile?next=" + encodeURIComponent(nextUrl))}`
        );
        return;
      }
      toast.error(e?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Sign out ─────────────────────────────────────────────────────
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  // ── Rating modal ─────────────────────────────────────────────────
  const handleRateClick = useCallback(
    (
      sourceType: RatingSourceType,
      sourceId: string,
      companyId: string,
      companyName: string,
      existing: CompanyRating | null
    ) => {
      setRatingModal({ open: true, sourceType, sourceId, companyId, companyName, existing });
    },
    []
  );

  // ── Leave Queue Request Modal ─────────────────────────────────────
  const handleLeaveQueueRequest = useCallback((entry: QueueItem) => {
    const qAny = entry as any;
    const companyName = qAny.company?.name || qAny.service?.company?.name || "Service";
    const serviceName = qAny.service?.name || "Walk-in";
    const pos = entry.position ? `#${entry.position}` : "your spot";

    setConfirmModal({
      open: true,
      type: "leave_queue",
      id: entry.id,
      title: "Leave the Queue?",
      subtitle: `${companyName} · ${serviceName}`,
      description: `Are you sure you want to leave the queue? You will give up ${pos} in line.`,
      confirmLabel: "Yes, Leave Queue",
      cancelLabel: "Keep My Spot",
    });
  }, []);

  // ── Cancel Booking Request Modal ──────────────────────────────────
  const handleCancelBookingRequest = useCallback((booking: Booking) => {
    const companyName = booking.company?.name || "Company";
    const serviceName = booking.service?.name || "Appointment";

    setConfirmModal({
      open: true,
      type: "cancel_booking",
      id: booking.id,
      title: "Cancel Booking?",
      subtitle: `${companyName} · ${serviceName}`,
      description: "Are you sure you want to cancel this booking appointment? This action cannot be undone.",
      confirmLabel: "Yes, Cancel Booking",
      cancelLabel: "Keep Booking",
    });
  }, []);

  // ── Execute Confirmation Action ───────────────────────────────────
  const handleConfirmModalAction = async () => {
    if (!confirmModal) return;
    setConfirmLoading(true);
    try {
      if (confirmModal.type === "leave_queue") {
        await leaveQueue(confirmModal.id);
        setQueueEntries((prev) =>
          prev.map((q) => (q.id === confirmModal.id ? { ...q, status: "noshow" } : q))
        );
        toast.success("You have left the queue.");
      } else if (confirmModal.type === "cancel_booking") {
        await cancelBooking(String(confirmModal.id));
        setBookings((prev) =>
          prev.map((b) => (b.id === String(confirmModal.id) ? { ...b, status: "cancelled" } : b))
        );
        toast.success("Booking cancelled successfully.");
      }
      setConfirmModal(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.");
    } finally {
      setConfirmLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-6 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 space-y-6 sm:space-y-8">

          {/* ── 1. Hero Profile Banner ── */}
          <ProfileHero
            name={name || profile?.name || ""}
            email={profile?.email ?? null}
            createdAt={profile?.created_at}
            avatarUrl={avatarUrl}
            totalBookings={bookings.length}
            totalQueue={queueEntries.length}
            totalRatings={totalRatings}
            onEditClick={() => setDrawerOpen(true)}
          />

          {/* ── 2. Content Layout: Desktop (Account on Left, Activity on Right), Mobile (flex-col-reverse: Activity on Top, Account on Bottom) ── */}
          <div className="flex flex-col-reverse lg:flex-row items-start gap-6 sm:gap-8">

            {/* Left Column (Desktop) / Bottom (Mobile): Account Section */}
            <div className="w-full lg:w-[320px] shrink-0">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight mb-3">
                Account
              </h2>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-2xs overflow-hidden">

                {/* Personal Details */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Icon icon="solar:user-linear" className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Personal details
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Name, phone, avatar</p>
                    </div>
                  </div>
                  <Icon
                    icon="solar:alt-arrow-right-linear"
                    className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </button>

                {/* Saved Services */}
                <button
                  type="button"
                  onClick={() => setSavedDrawerOpen(true)}
                  className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                      <Icon icon="solar:bookmark-linear" className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Saved services
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {savedServices.length} {savedServices.length === 1 ? "service" : "services"} saved
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {savedServices.length > 0 && (
                      <span className="text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        {savedServices.length}
                      </span>
                    )}
                    <Icon
                      icon="solar:alt-arrow-right-linear"
                      className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </button>
                {/* Sign Out */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Icon icon="solar:logout-2-linear" className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-sm text-rose-600">
                      Sign out
                    </h4>
                  </div>
                </button>

              </div>
            </div>

            {/* Right Column (Desktop with more width) / Top (Mobile): My Activity Section */}
            <div className="w-full lg:flex-1">
              <ActivityTabs
                bookings={bookings}
                queueEntries={queueEntries}
                ratingsMap={ratingsMap}
                onRateClick={handleRateClick}
                onCancelBooking={handleCancelBookingRequest}
                onLeaveQueue={handleLeaveQueueRequest}
              />
            </div>

          </div>

        </div>
      </div>

      {/* ── Saved Services Drawer ── */}
      <SavedServicesDrawer
        open={savedDrawerOpen}
        onClose={() => setSavedDrawerOpen(false)}
        savedServices={savedServices}
        onRemove={handleRemoveSaved}
      />

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

      {/* ── Confirm Leave Queue / Cancel Booking Modal ── */}
      {confirmModal && (
        <ConfirmModal
          state={confirmModal}
          loading={confirmLoading}
          onClose={() => !confirmLoading && setConfirmModal(null)}
          onConfirm={handleConfirmModalAction}
        />
      )}
    </>
  );
}