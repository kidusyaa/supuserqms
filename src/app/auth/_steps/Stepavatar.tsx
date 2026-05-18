// auth/_steps/Step3Avatar.tsx
"use client";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button }     from "@/components/ui/button";
import { AvatarCard } from "@/app/profile/_component/Avatarcard";

interface Props {
  avatars: { id: string; url: string }[];
  avatarId: string | null;
  onAvatarChange: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Avatar({ avatars, avatarId, onAvatarChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Pick your avatar ✨</h2>
        <p className="text-gray-500 text-sm">Choose one that represents you — or skip</p>
      </div>

      {avatars.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {avatars.map((a) => (
            <AvatarCard
              key={a.id}
              avatar={a}
              selected={avatarId === a.id}
              onSelect={() => onAvatarChange(avatarId === a.id ? "" : a.id)}
            />
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="h-12 px-4 rounded-xl border-gray-200">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold border-0 shadow-md shadow-amber-200 flex items-center justify-center gap-2"
        >
          {avatarId ? "Continue" : "Skip"} <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}