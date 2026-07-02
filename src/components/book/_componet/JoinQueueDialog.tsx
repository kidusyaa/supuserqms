"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { format, isToday } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Image from "next/image";
import { toast } from "sonner";
import { User, Phone, UserCheck, Clock, Hash } from "lucide-react";

import {
  getAuthUserOrNull,
  getMyProfileOrNull,
  isProfileComplete,
  joinQueue,
  CreateQueuePayload,
} from "@/lib/supabase-utils";
import type {
  Company,
  Service,
  Provider,
  QueueItem,
  AugmentedQueueItem,
} from "@/type";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type QueueMode = "self" | "walk_in";

interface JoinQueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company;
  selectedProvider: Provider;
  currentQueueCount: number;
  estimatedQueueStartTime: Date | null;
  onQueueJoined: (
    queueEntry: QueueItem,
    estimatedStartTime: Date | null,
    estimatedEndTime: Date | null
  ) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function JoinQueueDialog({
  open,
  onOpenChange,
  service,
  company,
  selectedProvider,
  currentQueueCount,
  estimatedQueueStartTime,
  onQueueJoined,
}: JoinQueueDialogProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<QueueMode>("self");
  const [notes, setNotes] = useState("");

  // Walk-in form fields
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");

  // Logged-in user data (auto-filled)
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profilePhone, setProfilePhone] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setNotes("");
      setWalkInName("");
      setWalkInPhone("");
      setProfileChecked(false);
    }
  }, [open]);

  // ── Check auth status when dialog opens ───────────────────────────────────
  // We do NOT redirect — we just detect whether user is logged in.
  // Walk-in mode is always available; self mode requires login.
  useEffect(() => {
    if (!open) return;

    const checkAuth = async () => {
      const user = await getAuthUserOrNull();
      if (!user) {
        setIsLoggedIn(false);
        setMode("walk_in"); // default to walk-in if not logged in
        setProfileChecked(true);
        return;
      }

      const profile = await getMyProfileOrNull();
      if (profile && isProfileComplete(profile)) {
        setIsLoggedIn(true);
        setProfileName(profile.name ?? null);
        setProfilePhone(profile.phone_number ?? null);
        setMode("self"); // default to self if logged in
      } else {
        setIsLoggedIn(false);
        setMode("walk_in");
      }
      setProfileChecked(true);
    };

    checkAuth();
  }, [open]);

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleJoinQueue = async () => {
    // Validate walk-in fields
    if (mode === "walk_in") {
      if (!walkInName.trim()) {
        toast.error("Please enter the customer's name.");
        return;
      }
      if (!walkInPhone.trim()) {
        toast.error("Please enter the customer's phone number.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const queuePayload: CreateQueuePayload = {
        service_id: service.id,
        provider_id: selectedProvider.isAny ? null : selectedProvider.id,
        queued_by_type: mode,
        queue_type: "walk-in",
        notes: notes.trim() || null,
        // For walk-in: use form values; for self: API will use profile
        user_name: mode === "walk_in" ? walkInName.trim() : undefined,
        phone_number: mode === "walk_in" ? walkInPhone.trim() : undefined,
      };

      const createdQueueEntry: AugmentedQueueItem = await joinQueue(queuePayload);

      if (!createdQueueEntry?.id) {
        throw new Error("Queue entry created but no ID returned.");
      }

      toast.success(
        mode === "walk_in"
          ? `${walkInName} has been added to the queue!`
          : "You have successfully joined the queue!"
      );
      onOpenChange(false);

      onQueueJoined(
        createdQueueEntry,
        createdQueueEntry.estimatedServiceStartTime ?? null,
        createdQueueEntry.estimatedServiceEndTime ?? null
      );
    } catch (error: any) {
      console.error("Failed to join queue:", error);

      if (error?.code === "AUTH_REQUIRED") {
        // Self-queue failed: nudge to walk-in instead
        toast.error("You need to be logged in for self-queue. Use walk-in instead.");
        setMode("walk_in");
        return;
      }
      if (error?.code === "PROFILE_INCOMPLETE") {
        onOpenChange(false);
        router.push(`/profile?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      toast.error(error.message || "Failed to join queue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Join Queue — {service.name}
          </DialogTitle>
          <DialogDescription>
            {company.name} · {selectedProvider.name}
          </DialogDescription>
        </DialogHeader>

        {/* Service summary strip */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Image
            src={service.photo || "/placeholder.svg?height=48&width=48"}
            alt={service.name}
            width={48}
            height={48}
            className="rounded-md object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{service.name}</p>
            <p className="text-xs text-muted-foreground">{company.name}</p>
          </div>
          {/* Queue stats */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              Position {currentQueueCount + 1}
            </span>
            {estimatedQueueStartTime ? (
              <span className="flex items-center gap-1 text-xs font-medium text-orange-600">
                <Clock className="h-3 w-3" />
                {format(estimatedQueueStartTime, "h:mm a")}
                {isToday(estimatedQueueStartTime) ? " Today" : ` ${format(estimatedQueueStartTime, "MMM d")}`}
              </span>
            ) : (
              <span className="text-xs text-red-500">Time unavailable</span>
            )}
          </div>
        </div>

        {/* Mode tabs — only shown after profile check */}
        {profileChecked && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as QueueMode)}>
            <TabsList className="w-full">
              <TabsTrigger value="self" className="flex-1 gap-2" disabled={!isLoggedIn}>
                <UserCheck className="h-4 w-4" />
                My Account
                {!isLoggedIn && (
                  <span className="text-[10px] text-muted-foreground ml-1">(sign in)</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="walk_in" className="flex-1 gap-2">
                <User className="h-4 w-4" />
                Walk-in
              </TabsTrigger>
            </TabsList>

            {/* ── SELF tab ── */}
            <TabsContent value="self" className="mt-4 space-y-4">
              {isLoggedIn ? (
                <div className="space-y-3">
                  {/* Auto-filled profile info (read-only) */}
                  <div className="p-3 border border-dashed rounded-lg bg-green-50/60 space-y-2">
                    <p className="text-xs font-medium text-green-700 mb-1">
                      Using your profile details
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{profileName ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profilePhone ?? "—"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="self-notes" className="text-sm">
                      Notes <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="self-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific requests?"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You need to be signed in to use this option.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
                    }}
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* ── WALK-IN tab ── */}
            <TabsContent value="walk_in" className="mt-4 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="walkin-name" className="text-sm">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="walkin-name"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="Full name"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="walkin-phone" className="text-sm">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="walkin-phone"
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="+251 9XX XXX XXX"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="walkin-notes" className="text-sm">
                  Notes <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="walkin-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific requests?"
                />
              </div>

              <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded p-2">
                Walk-in customers do not need an account. Their name and phone number will be used to notify them.
              </p>
            </TabsContent>
          </Tabs>
        )}

        {/* Reminder notice */}
        <p className="text-xs text-primary font-medium text-center">
          Please arrive at least 30 minutes before the estimated start time.
        </p>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinQueue}
            disabled={
              isLoading ||
              !profileChecked ||
              (mode === "self" && !isLoggedIn)
            }
            className="min-w-[120px]"
          >
            {isLoading
              ? "Joining..."
              : mode === "walk_in"
              ? "Add to Queue"
              : "Join Queue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}