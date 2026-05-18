// auth/_steps/Step1Email.tsx
"use client";
import { Mail, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

interface Props {
  email: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

export function Step1Email({ email, onChange, onNext }: Props) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="text-gray-500 text-sm">Start with your email address</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email <span className="text-red-400">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && valid && onNext()}
            placeholder="you@example.com"
            className="pl-10 rounded-xl border-gray-200 focus:border-amber-400 focus:ring-amber-400/20 h-12"
          />
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!valid}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold border-0 shadow-md shadow-amber-200 flex items-center justify-center gap-2"
      >
        Continue <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}