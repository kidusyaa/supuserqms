// profile/_components/ProfileHero.tsx
"use client";
import Image from "next/image";
import { Pencil, CalendarCheck, Clock3, Star } from "lucide-react";

interface Props {
  name: string;
  email: string | null;
  avatarUrl: string | null;
  totalBookings: number;
  totalQueue: number;
  totalRatings: number;
  onEditClick: () => void;
}

export function ProfileHero({
  name, email, avatarUrl,
  totalBookings, totalQueue, totalRatings,
  onEditClick,
}: Props) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="relative rounded-3xl overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400" />

      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

      <div className="relative px-6 pt-8 pb-6">
        {/* Edit button */}
        <button
          onClick={onEditClick}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm flex items-center justify-center transition-all border border-white/30"
          aria-label="Edit profile"
        >
          <Pencil className="w-4 h-4 text-white" />
        </button>

        {/* Avatar + identity */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/40 shadow-2xl bg-white/20 flex items-center justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl} alt={name}
                  width={96} height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-3xl font-bold text-white">{initials}</span>
              )}
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
          </div>

          <div className="text-center sm:text-left pb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {name || "Set your name"}
            </h1>
            {email && <p className="text-white/70 text-sm mt-0.5">{email}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: CalendarCheck, label: "Bookings", value: totalBookings },
            { icon: Clock3,        label: "Queues",   value: totalQueue    },
            { icon: Star,          label: "Ratings",  value: totalRatings  },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/15 backdrop-blur-sm rounded-2xl px-3 py-3 text-center border border-white/20">
              <Icon className="w-4 h-4 text-white/80 mx-auto mb-1" />
              <p className="text-xl font-bold text-white leading-none">{value}</p>
              <p className="text-white/70 text-[11px] mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}