// profile/ProfileClient.tsx — orchestration shell
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

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
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { ProfileHero } from "./Profilehero";
import { RatingModal, type RatingModalState } from "./Ratingmodal";
import type { Booking, QueueItem } from "@/type";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogOut, ShieldCheck, HelpCircle } from "lucide-react";

export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  // ── State ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("bookings"); // "bookings" | "queue" | "settings"
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<{ id: string; url: string }[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueItem[]>([]);
  const [ratingModal, setRatingModal] = useState<RatingModalState | null>(null);
  const [signingOut, setSigningOut] = useState(false);

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
      toast.success("Profile synced with cloud database.");
      
      // Auto-toggle back to activity view upon completion
      setActiveSection("bookings");
      
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

  // ── Sign Out ─────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      toast.success("Successfully logged out. Goodbye!");
      router.replace("/");
      router.refresh();
    } catch (err: any) {
      toast.error("Logout failed: " + err?.message);
    } finally {
      setSigningOut(false);
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

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-400 font-mono tracking-wider">LOADING USER CONSOLE…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden">
        {/* Glow ambient panels */}
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-gradient-to-br from-cyan-400/5 to-violet-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[35vw] h-[35vw] bg-gradient-to-tr from-amber-400/5 to-violet-500/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <div className="min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Responsive Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ── SIDEBAR CONSOLE (LG: 4/12 width) ── */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile Card Info */}
              <ProfileHero
                name={name || profile?.name || ""}
                email={profile?.email ?? null}
                avatarUrl={avatarUrl}
                totalBookings={bookings.length}
                totalQueue={queueEntries.length}
                totalRatings={totalRatings}
                activeTab={activeSection === "settings" ? "settings" : activeSection}
                setActiveTab={(tab) => {
                  if (tab === "settings") {
                    setActiveSection("settings");
                  } else {
                    setActiveSection(tab);
                  }
                }}
                joinedAt={profile?.created_at}
              />

              {/* Security & Session Action Control */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                    Security & Session
                  </h3>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold tracking-tight">
                    ENCRYPTED
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Active Provider:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">Supabase Auth</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Identity Status:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {isProfileComplete(profile) ? "Synchronized" : "Incomplete Profile"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  <button
                    onClick={() => setActiveSection("settings")}
                    className={`flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold border cursor-pointer transition-all duration-300 ${
                      activeSection === "settings"
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-violet-500/30 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </button>

                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 hover:border-rose-500 cursor-pointer transition-all duration-300 disabled:opacity-50"
                  >
                    {signingOut ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Signing Out…
                      </span>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        Sign Out Session
                      </>
                    )}
                  </button>
                </div>
              </motion.div>

            </div>

            {/* ── MAIN LOG CONTROL CENTER (LG: 8/12 width) ── */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {activeSection === "settings" ? (
                  <ProfileSettingsForm
                    key="settings-form"
                    name={name}
                    phone={phone}
                    avatarId={avatarId}
                    avatars={avatars}
                    saving={saving}
                    onNameChange={setName}
                    onPhoneChange={setPhone}
                    onAvatarChange={setAvatarId}
                    onSave={handleSave}
                    onCancel={() => setActiveSection("bookings")}
                  />
                ) : (
                  <motion.div
                    key="activity-log"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Activity Logs
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          View details of bookings and real-time waiting list tokens.
                        </p>
                      </div>
                    </div>

                    <ActivityTabs
                      bookings={bookings}
                      queueEntries={queueEntries}
                      ratingsMap={ratingsMap}
                      onRateClick={handleRateClick}
                      activeSection={activeSection}
                      setActiveSection={setActiveSection}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>

      {/* Rating modal popup */}
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