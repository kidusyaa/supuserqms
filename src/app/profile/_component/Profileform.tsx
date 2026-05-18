/**
 * profile/components/ProfileForm.tsx
 * ─────────────────────────────────────────────
 * Name, phone, and avatar editor. Fully self-contained UI;
 * parent passes state + handlers.
 */

"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  name: string;
  phone: string;
  avatarId: string | null;
  avatars: { id: string; url: string }[];
  selectedAvatarUrl: string | null;
  isComplete: boolean;
  saving: boolean;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onAvatarChange: (id: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export function ProfileForm({
  name,
  phone,
  avatarId,
  avatars,
  selectedAvatarUrl,
  isComplete,
  saving,
  onNameChange,
  onPhoneChange,
  onAvatarChange,
  onSave,
  onBack,
}: ProfileFormProps) {
  return (
    <div className="space-y-5">
      {/* Preview strip */}
      <div className="flex items-center gap-4 rounded-2xl border bg-gradient-to-r from-amber-50 to-orange-50 p-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-white shadow-sm bg-white flex items-center justify-center shrink-0">
          {selectedAvatarUrl ? (
            <Image
              src={selectedAvatarUrl}
              alt="Selected avatar"
              width={64}
              height={64}
              className="h-16 w-16 object-cover"
            />
          ) : (
            <span className="text-2xl">👤</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{name?.trim() || "Your name"}</p>
          <p className="text-sm text-muted-foreground truncate">
            {phone?.trim() || "Your phone number"}
          </p>
        </div>
        <div className="ml-auto">
          {isComplete ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
              ✓ Complete
            </Badge>
          ) : (
            <Badge variant="secondary">Required</Badge>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your name"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Phone number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+2519…"
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Avatars */}
      <div className="space-y-2">
        <Label>
          Avatar <span className="text-gray-400 font-normal">(optional)</span>
        </Label>
        {avatars.length === 0 ? (
          <p className="text-xs text-muted-foreground">No avatars configured.</p>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
            {avatars.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onAvatarChange(a.id)}
                className={`rounded-xl border-2 p-1 transition-all duration-150 ${
                  avatarId === a.id
                    ? "border-amber-400 ring-2 ring-amber-400/30 scale-105"
                    : "border-gray-200 hover:border-amber-300"
                }`}
                aria-label={`Select avatar ${a.id}`}
              >
                <Image
                  src={a.url}
                  alt={`avatar ${a.id}`}
                  width={56}
                  height={56}
                  className="rounded-lg object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onSave}
          disabled={saving || !name.trim() || !phone.trim()}
          className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white border-0 shadow-md shadow-amber-200"
        >
          {saving ? "Saving…" : isComplete ? "Save" : "Save & Continue"}
        </Button>
        <Button variant="outline" onClick={onBack} className="rounded-xl">
          Back home
        </Button>
      </div>
    </div>
  );
}