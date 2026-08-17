"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
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

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-amber-500 text-amber-600 text-sm font-semibold hover:bg-amber-50 transition-all shadow-xs"
      >
        <User className="w-4 h-4 text-amber-500" />
        <span>Sign In</span>
      </Link>
    );
  }

  const initials = profile?.name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <Link
      href="/profile"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-amber-500 text-slate-800 text-sm font-semibold hover:bg-amber-50 transition-all shadow-xs"
    >
      <div className="w-7 h-7 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center shrink-0 border border-amber-300">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="Profile" width={28} height={28} className="object-cover" />
        ) : (
          <span className="text-xs font-bold text-amber-600">{initials}</span>
        )}
      </div>
      <span className="text-xs font-semibold text-amber-600 hidden sm:inline">{profile?.name || "Account"}</span>
    </Link>
  );
}