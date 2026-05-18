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
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all"
      >
        <User className="w-4 h-4" />
        <span>Sign In</span>
      </Link>
    );
  }

  const initials = profile?.name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <Link href="/profile" className="flex items-center gap-2 group">
      <div className="w-9 h-9 rounded-full overflow-hidden bg-amber-100 border-2 border-transparent group-hover:border-amber-500 transition-all flex items-center justify-center shrink-0">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="Profile" width={36} height={36} className="object-cover" />
        ) : (
          <span className="text-xs font-bold text-amber-600">{initials}</span>
        )}
      </div>
    </Link>
  );
}