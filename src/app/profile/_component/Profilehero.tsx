// profile/_components/ProfileHero.tsx
"use client";
import Image from "next/image";
import { CalendarCheck, Clock3, Star, Sparkles, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  name: string;
  email: string | null;
  avatarUrl: string | null;
  totalBookings: number;
  totalQueue: number;
  totalRatings: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  joinedAt?: string | null;
}

export function ProfileHero({
  name,
  email,
  avatarUrl,
  totalBookings,
  totalQueue,
  totalRatings,
  activeTab,
  setActiveTab,
  joinedAt,
}: Props) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const formattedDate = joinedAt
    ? new Date(joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })
    : "June 2026";

  const statItems = [
    { id: "bookings", icon: CalendarCheck, label: "Bookings", value: totalBookings, color: "text-cyan-400", glow: "shadow-cyan-500/10" },
    { id: "queue", icon: Clock3, label: "Queues", value: totalQueue, color: "text-violet-400", glow: "shadow-violet-500/10" },
    { id: "ratings", icon: Star, label: "Ratings", value: totalRatings, color: "text-amber-400", glow: "shadow-amber-500/10" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl p-6 text-white"
    >
      {/* Dynamic Glowing Ambient Blobs */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-violet-600/25 rounded-full blur-[80px] pointer-events-none animate-pulse duration-[6s]" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/15 rounded-full blur-[70px] pointer-events-none animate-pulse duration-[8s]" />

      {/* Cybernetic Dot Matrix Backdrop */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Profile Header Content */}
      <div className="relative flex flex-col items-center text-center sm:text-left sm:items-start gap-5">
        
        {/* Holographic Avatar Showcase */}
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
          <div className="relative group shrink-0">
            {/* Pulsing neon outer glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-cyan-400 via-violet-600 to-amber-400 opacity-75 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500" />
            
            {/* Spinning Holographic Border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 p-[2px] animate-spin [animation-duration:12s]" />

            {/* Inner avatar container */}
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center m-[2px]">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name || "User Avatar"}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 font-mono">
                  {initials}
                </span>
              )}
            </div>

            {/* Glowing online state beacon */}
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900 shadow-[0_0_8px_#10b981]"></span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
                {name || "Set Name"}
              </h1>
              <span className="p-1 rounded-lg bg-violet-500/10 border border-violet-500/35 text-[10px] text-violet-300 font-mono flex items-center gap-1 shadow-inner">
                <Sparkles className="w-3 h-3 text-violet-400" />
                AI-SYNC
              </span>
            </div>
            
            {email && <p className="text-slate-400 text-sm mt-1 truncate">{email}</p>}
            
            <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>GizeBook agent since {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Stats Console */}
        <div className="w-full grid grid-cols-3 gap-3 mt-4">
          {statItems.map(({ id, icon: Icon, label, value, color }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={label}
                onClick={() => setActiveTab(id)}
                className={`relative group rounded-2xl p-3 text-center border transition-all duration-300 overflow-hidden ${
                  isActive
                    ? "bg-slate-800/85 border-violet-500/60 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                    : "bg-slate-950/40 border-slate-800/50 hover:bg-slate-800/40 hover:border-slate-700/60"
                }`}
              >
                {/* Micro glow overlay */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 pointer-events-none" />
                )}

                <Icon className={`w-5 h-5 mx-auto mb-1.5 transition-transform group-hover:scale-110 duration-300 ${color}`} />
                <p className="text-2xl font-extrabold tracking-tight leading-none text-white">
                  {value}
                </p>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-1.5 font-semibold">
                  {label}
                </p>

                {/* Cyber active line indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}