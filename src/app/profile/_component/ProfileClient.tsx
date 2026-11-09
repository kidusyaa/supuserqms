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
import PaymentVerificationModal from "@/components/book/_componet/PaymentVerificationModal";
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
  const [paymentModalBooking, setPaymentModalBooking] = useState<Booking | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

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
          <div className="w-8 h-8 rounded-full border-2 border-[#FBA819] border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 py-6 sm:py-10 pb-24 md:pb-10">
        <div className="max-w-6xl mx-auto px-4">
          
          <div className="flex flex-col lg:flex-row items-start gap-6 sm:gap-8">
            
            {/* ── Left Column: Profile Card + Navigation Menu (Desktop) ── */}
            <div className="w-full lg:w-[310px] shrink-0 space-y-4">
              {/* Profile Card */}
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

              {/* Navigation Links Card (Desktop only, hidden on mobile bottom nav) */}
              <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-2 divide-y divide-slate-100 dark:divide-slate-800 shadow-2xs overflow-hidden">
                {/* Personal Details */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-2xl transition-colors text-left group cursor-pointer"
                >
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Personal details
                  </span>
                  <Icon
                    icon="solar:alt-arrow-right-linear"
                    className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </button>

                {/* Saved Services */}
                <button
                  type="button"
                  onClick={() => setSavedDrawerOpen(true)}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-2xl transition-colors text-left group cursor-pointer"
                >
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Saved services
                  </span>
                  <div className="flex items-center gap-2">
                    {savedServices.length > 0 && (
                      <span className="text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
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
                  className="w-full p-3.5 flex items-center justify-between hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-2xl transition-colors text-left group cursor-pointer"
                >
                  <span className="font-semibold text-sm text-rose-600">
                    Sign out
                  </span>
                  <Icon
                    icon="solar:logout-2-linear"
                    className="w-4 h-4 text-rose-500"
                  />
                </button>
              </div>
            </div>

            {/* ── Right Column: My Activity Section + Filter Bar ── */}
            <div className="w-full lg:flex-1">
              <ActivityTabs
                bookings={bookings}
                queueEntries={queueEntries}
                ratingsMap={ratingsMap}
                onRateClick={handleRateClick}
                onCancelBooking={handleCancelBookingRequest}
                onLeaveQueue={handleLeaveQueueRequest}
                onReuploadProof={(b) => {
                  setPaymentModalBooking(b);
                  setPaymentModalOpen(true);
                }}
              />
            </div>

          </div>

        </div>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION BAR (Matches Mockup) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-around shadow-lg">
        {/* Activity Tab */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-xs font-bold text-amber-600 dark:text-amber-400 flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <span>Activity</span>
        </button>

        {/* Details Tab */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <span>Details</span>
        </button>

        {/* Saved Tab */}
        <button
          type="button"
          onClick={() => setSavedDrawerOpen(true)}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <span>Saved · {savedServices.length}</span>
        </button>

        {/* Sign Out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <span>Sign out</span>
        </button>
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

      {/* ── Payment / Prepayment Verification Modal ── */}
      {paymentModalBooking && paymentModalBooking.service && paymentModalBooking.company && (
        <PaymentVerificationModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          booking={paymentModalBooking}
          service={paymentModalBooking.service}
          company={paymentModalBooking.company}
          selectedProvider={
            paymentModalBooking.provider || {
              id: paymentModalBooking.provider_id || "provider",
              name: "Assigned Specialist",
              specialization: null,
              is_active: true,
              created_at: new Date().toISOString(),
              company_id: paymentModalBooking.company_id,
            }
          }
          onSuccess={() => {
            getMyBookings().then(setBookings);
          }}
        />
      )}
    </>
  );
}