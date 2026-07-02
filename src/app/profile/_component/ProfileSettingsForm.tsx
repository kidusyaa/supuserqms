// profile/_components/ProfileSettingsForm.tsx
"use client";
import Image from "next/image";
import { User, Phone, Check, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

interface Props {
  name: string;
  phone: string;
  avatarId: string | null;
  avatars: { id: string; url: string }[];
  saving: boolean;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onAvatarChange: (id: string) => void;
  onSave: () => void;
  onCancel?: () => void;
}

export function ProfileSettingsForm({
  name,
  phone,
  avatarId,
  avatars,
  saving,
  onNameChange,
  onPhoneChange,
  onAvatarChange,
  onSave,
  onCancel,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm overflow-hidden relative"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
            Profile Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure your identities across the GizeBook booking network.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Fields */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Full Name <span className="text-rose-500">*</span>
            </Label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <User className="w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              </div>
              <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter your name"
                className="pl-10 rounded-xl h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-violet-500/20 text-slate-900 dark:text-white transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Phone Number <span className="text-rose-500">*</span>
            </Label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              </div>
              <Input
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="+251 9XX XXX XXX"
                inputMode="tel"
                className="pl-10 rounded-xl h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-violet-500/20 text-slate-900 dark:text-white transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Avatar Select Matrix */}
        {avatars.length > 0 && (
          <div className="space-y-3 pt-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Select Holographic Avatar
            </Label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {avatars.map((a) => {
                const isSelected = avatarId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onAvatarChange(a.id)}
                    className={`relative rounded-2xl p-1 transition-all duration-300 group hover:scale-105 ${
                      isSelected
                        ? "bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-500 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-violet-500/25"
                    }`}
                  >
                    <div className="relative aspect-square rounded-[14px] overflow-hidden bg-slate-950">
                      <Image
                        src={a.url}
                        alt="Avatar Option"
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="70px"
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-tr from-cyan-400 to-violet-600 rounded-full flex items-center justify-center shadow-md animate-bounce [animation-duration:3s]">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action triggers */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <Button
            onClick={onSave}
            disabled={saving || !name.trim() || !phone.trim()}
            className="rounded-xl h-12 px-6 flex-1 sm:flex-initial font-bold tracking-tight bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 hover:from-cyan-600 hover:via-violet-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-violet-500/10 cursor-pointer disabled:opacity-50 transition-all duration-300 hover:scale-[1.02]"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Syncing Network…
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>

          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="rounded-xl h-12 px-6 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 font-semibold cursor-pointer"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
