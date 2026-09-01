// profile/_components/ProfileEditDrawer.tsx
"use client";
import Image from "next/image";
import { X, User, Phone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
  name: string;
  phone: string;
  avatarId: string | null;
  avatars: { id: string; url: string }[];
  saving: boolean;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onAvatarChange: (id: string) => void;
  onSave: () => void;
}

export function ProfileEditDrawer({
  open, onClose,
  name, phone, avatarId, avatars,
  saving,
  onNameChange, onPhoneChange, onAvatarChange, onSave,
}: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Bottom-sheet drawer */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl
        max-h-[90vh] overflow-y-auto
        transition-transform duration-300 ease-out
        ${open ? "translate-y-0" : "translate-y-full"}
      `}>
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 pb-8">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Full name <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Your full name"
                className="pl-10 rounded-xl h-12 border-gray-200 focus:border-amber-400 focus:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Phone number <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="+251 9XX XXX XXX"
                inputMode="tel"
                className="pl-10 rounded-xl h-12 border-gray-200 focus:border-amber-400 focus:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Avatar grid */}
          {avatars.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Avatar</Label>
              <div className="grid grid-cols-5 gap-2">
                {avatars.map((a) => (
                  <button
                    key={a.id} type="button"
                    onClick={() => onAvatarChange(a.id)}
                    className={`relative rounded-xl p-1 transition-all duration-150  ${
                      avatarId === a.id
                        ? "ring-2 ring-amber-400 ring-offset-1 scale-105"
                        : "ring-1 ring-gray-200 hover:ring-amber-300"
                    }`}
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50">
                      <Image src={a.url} alt={a.id} fill className="object-cover" sizes="64px" />
                    </div>
                    {avatarId === a.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          <Button
            onClick={onSave}
            disabled={saving || !name.trim() || !phone.trim()}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold border-0 shadow-md shadow-amber-200"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving…
              </span>
            ) : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );
}