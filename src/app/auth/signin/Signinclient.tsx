// app/auth/signin/SignInClient.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SignInClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Safely unwrap any nested /profile?next= redirect chain
  const nextUrl = useMemo(() => {
    const raw = searchParams.get("next") || "/";
    try {
      const decoded = decodeURIComponent(raw);
      const inner   = new URL(decoded, "http://x").searchParams.get("next");
      if (decoded.startsWith("/profile") && inner) return inner;
      return decoded;
    } catch {
      return raw;
    }
  }, [searchParams]);

  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const afterSignIn = () => router.push(`/profile?next=${encodeURIComponent(nextUrl)}`);

  // ── Password sign-in ─────────────────────────────────────────
  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Sign in failed.");
      toast.success("Welcome back!");
      afterSignIn();
    } catch (e: any) {
      toast.error(e?.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  // ── Magic link ────────────────────────────────────────────────
  const handleMagicLink = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/profile?next=${encodeURIComponent(nextUrl)}`
              : undefined,
          data: { role: "customer" },
        },
      });
      if (error) throw error;
      toast.success("Magic link sent — check your email.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send magic link.");
    } finally {
      setLoading(false);
    }
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-white to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

          <div className="px-8 py-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back 👋</h1>
              <p className="text-gray-500 text-sm">Sign in to your account</p>
            </div>

            <Tabs defaultValue="password">
              <TabsList className="grid grid-cols-2 w-full rounded-xl bg-gray-100 p-1">
                <TabsTrigger value="password" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Password
                </TabsTrigger>
                <TabsTrigger value="magic" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Magic link
                </TabsTrigger>
              </TabsList>

              {/* Shared email field */}
              <div className="mt-5 space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 rounded-xl h-12 border-gray-200 focus:border-amber-400 focus:ring-amber-400/20"
                  />
                </div>
              </div>

              {/* Password tab */}
              <TabsContent value="password" className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && emailValid && password && handleSignIn()}
                      placeholder="Your password"
                      className="pl-10 pr-10 rounded-xl h-12 border-gray-200 focus:border-amber-400 focus:ring-amber-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleSignIn}
                  disabled={loading || !emailValid || !password}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold border-0 shadow-md shadow-amber-200"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Signing in…
                    </span>
                  ) : "Sign in"}
                </Button>
              </TabsContent>

              {/* Magic link tab */}
              <TabsContent value="magic" className="space-y-4 mt-4">
                <p className="text-xs text-gray-400 text-center">
                  We'll send a one-click sign-in link to your email. No password needed.
                </p>
                <Button
                  onClick={handleMagicLink}
                  disabled={loading || !emailValid}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold border-0 shadow-md shadow-amber-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Send magic link
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sign up link */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Don't have an account?{" "}
          <Link
            href={`/auth?next=${encodeURIComponent(nextUrl)}`}
            className="text-amber-500 hover:text-amber-600 font-medium"
          >
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}