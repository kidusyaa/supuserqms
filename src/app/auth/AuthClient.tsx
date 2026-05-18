"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { supabase }    from "@/lib/supabaseClient";
import { getAvatars }  from "@/lib/supabase-utils";
import { Step1Email } from "./_steps/Step1email";
import { Step2Info } from "./_steps/stepinfo";
import { StepIndicator } from "./Stepindicator";
import { Step3Avatar } from "./_steps/Stepavatar";
import { Step4Password } from "./_steps/Step4password";

export default function AuthClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Unwrap any nested /profile?next= from previous redirects
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

  // ── Form state ────────────────────────────────────────────────
  const [step, setStep]         = useState(1);
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [avatars, setAvatars]   = useState<{ id: string; url: string }[]>([]);

  // Load avatars once
  useEffect(() => {
    getAvatars().then(setAvatars).catch(console.warn);
  }, []);

  // ── Final submit on step 4 ────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create the auth account
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role: "customer" }, // triggers only creates profiles row for customers
        },
      });
      if (error) throw error;

      const user = data.user;
      if (!user) {
        // Email confirmation required — tell them to verify
        toast.success("Check your email to confirm your account, then sign in.");
        router.push("/auth");
        return;
      }

      // 2. Save the profile (name, phone, avatar) immediately
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id:           user.id,
            email:        email.trim(),
            name:         name.trim(),
            phone_number: phone.trim(),
            avatar_id:    avatarId || null,
          },
          { onConflict: "id" }
        );

      if (profileError) {
        // Non-fatal — profile can be completed later
        console.warn("Profile save error:", profileError.message);
      }

      toast.success("Account created! Welcome 🎉");
      router.push(`/profile?next=${encodeURIComponent(nextUrl)}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-white to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
          <div className="px-8 py-8">
            <StepIndicator current={step} />

            {step === 1 && (
              <Step1Email
                email={email}
                onChange={setEmail}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <Step2Info
                name={name} phone={phone}
                onNameChange={setName} onPhoneChange={setPhone}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <Step3Avatar
                avatars={avatars} avatarId={avatarId}
                onAvatarChange={setAvatarId}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <Step4Password
                password={password}
                onPasswordChange={setPassword}
                onSubmit={handleSubmit}
                onBack={() => setStep(3)}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Already have account */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{" "}
          <button
            onClick={() => router.push(`/auth/signin?next=${encodeURIComponent(nextUrl)}`)}
            className="text-amber-500 hover:text-amber-600 font-medium"
          >
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}