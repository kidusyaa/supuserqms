// profile/_components/AvatarCard.tsx
import Image from "next/image";
import { Check } from "lucide-react";

interface AvatarCardProps {
  avatar: { id: string; url: string };
  selected: boolean;
  onSelect: () => void;
}

export function AvatarCard({ avatar, selected, onSelect }: AvatarCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        relative rounded-2xl p-1.5 transition-all duration-200
        ${selected
          ? "ring-2 ring-amber-400 ring-offset-2 scale-105 bg-amber-50"
          : "ring-1 ring-gray-200 hover:ring-amber-300 bg-white"
        }
      `}
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50">
        <Image
          src={avatar.url}
          alt={`Avatar ${avatar.id}`}
          fill
          className="object-cover"
          sizes="120px"
        />
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </button>
  );
}