// auth/_steps/Step2Info.tsx
"use client";
import { User, Phone, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

interface Props {
  name: string;
  phone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Info({ name, phone, onNameChange, onPhoneChange, onNext, onBack }: Props) {
  const valid = name.trim().length > 0 && phone.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">About you 👋</h2>
        <p className="text-gray-500 text-sm">Your name and phone number</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full name <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Your full name"
              className="pl-10 rounded-xl border-gray-200 focus:border-amber-400 focus:ring-amber-400/20 h-12"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone number <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="phone"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+251 9XX XXX XXX"
              inputMode="tel"
              className="pl-10 rounded-xl border-gray-200 focus:border-amber-400 focus:ring-amber-400/20 h-12"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="h-12 px-4 rounded-xl border-gray-200">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={onNext}
          disabled={!valid}
          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold border-0 shadow-md shadow-amber-200 flex items-center justify-center gap-2"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}