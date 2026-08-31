"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, avatars(url)")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            name: data.name,
            avatar_url: (data as any).avatars?.url ?? null,
          });
        }
      });
  }, [user]);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse border border-slate-200" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:border-slate-300 active:scale-95"
      >
        <User className="w-4 h-4 text-slate-600" />
        <span>Sign In</span>
      </Link>
    );
  }

  const initials = profile?.name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "ME";

  return (
    <Link
      href="/profile"
      className="inline-flex items-center gap-2 p-1 sm:pr-3 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:border-amber-400 group"
      title={profile?.name || user?.email || "My Profile"}
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-amber-50 flex items-center justify-center shrink-0 border border-amber-300 ring-2 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="Profile" width={32} height={32} className="object-cover w-full h-full" />
        ) : (
          <span className="text-[11px] sm:text-xs font-bold text-amber-700">{initials}</span>
        )}
      </div>
      <span className="text-xs sm:text-sm font-semibold text-slate-800 max-w-[90px] sm:max-w-[120px] truncate hidden sm:inline">
        {profile?.name || "Profile"}
      </span>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline group-hover:text-slate-600 transition-colors" />
    </Link>
  );
}