// auth/_steps/Step4Password.tsx
"use client";
import { useState } from "react";
import { Lock, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

interface Props {
  password: string;
  onPasswordChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function Step4Password({ password, onPasswordChange, onSubmit, onBack, loading }: Props) {
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);

  const lengthOk  = password.length >= 8;
  const matchOk   = password === confirm && confirm.length > 0;
  const valid     = lengthOk && matchOk;

  const strength = password.length === 0 ? 0
    : password.length < 8  ? 1
    : password.length < 12 ? 2
    : 3;

  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-emerald-400"];
  const strengthText  = ["", "text-red-500", "text-yellow-500", "text-emerald-500"];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Set your password 🔒</h2>
        <p className="text-gray-500 text-sm">At least 8 characters</p>
      </div>

      <div className="space-y-4">
        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="pw" className="text-sm font-medium text-gray-700">
            Password <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="pw"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className="pl-10 pr-10 rounded-xl border-gray-200 focus:border-amber-400 focus:ring-amber-400/20 h-12"
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1 h-1">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      strength >= s ? strengthColor[strength] : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${strengthText[strength]}`}>
                {strengthLabel[strength]}
              </p>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">
            Confirm password <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="confirm"
              type={showCf ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className={`pl-10 pr-10 rounded-xl h-12 border-gray-200 focus:ring-amber-400/20 transition-colors ${
                confirm.length > 0
                  ? matchOk
                    ? "border-emerald-400 focus:border-emerald-400"
                    : "border-red-300 focus:border-red-400"
                  : "focus:border-amber-400"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCf((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirm.length > 0 && !matchOk && (
            <p className="text-xs text-red-500">Passwords don't match</p>
          )}
          {matchOk && (
            <p className="text-xs text-emerald-500">✓ Passwords match</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={loading} className="h-12 px-4 rounded-xl border-gray-200">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!valid || loading}
          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold border-0 shadow-md shadow-amber-200"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Creating account…
            </span>
          ) : "Create account 🎉"}
        </Button>
      </div>
    </div>
  );
}