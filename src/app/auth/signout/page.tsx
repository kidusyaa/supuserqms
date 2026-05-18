
// app/auth/signout/page.tsx
// Visiting this page signs the user out and redirects to home.
// Link to it with: <Link href="/auth/signout">Sign out</Link>
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.signOut().finally(() => {
      router.replace("/");
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Signing out…</p>
      </div>
    </div>
  );
}