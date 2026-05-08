"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Mode = "signin" | "signup" | "otp";

export default function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectAfterAuth = () => router.push(nextUrl);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Sign in failed.");
      toast.success("Signed in.");
      redirectAfterAuth();
    } catch (e: any) {
      toast.error(e?.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      if (!data.user) {
        toast.success("Check your email to confirm your account.");
        return;
      }

      toast.success("Account created.");
      redirectAfterAuth();
    } catch (e: any) {
      toast.error(e?.message || "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin + nextUrl : undefined,
        },
      });
      if (error) throw error;
      toast.success("OTP link sent. Check your email.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Sign in to continue</CardTitle>
          <CardDescription>
            Booking and queue require an account. After sign in, you’ll complete your profile (name + phone) once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>

            <div className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  inputMode="email"
                  autoComplete="email"
                />
              </div>

              {(mode === "signin" || mode === "signup") && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </div>
              )}
            </div>

            <TabsContent value="signin" className="mt-6">
              <Button className="w-full" disabled={loading || !email.trim() || !password} onClick={handleSignIn}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <Button className="w-full" disabled={loading || !email.trim() || !password} onClick={handleSignUp}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </TabsContent>

            <TabsContent value="otp" className="mt-6 space-y-3">
              <Button className="w-full" disabled={loading || !email.trim()} onClick={handleOtp}>
                {loading ? "Sending..." : "Send OTP link"}
              </Button>
              <p className="text-xs text-muted-foreground">
                We’ll email you a magic link to sign in. (No password needed.)
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

