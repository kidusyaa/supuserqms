"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getAuthUserOrNull,
  getAvatars,
  getMyBookings,
  getMyProfileOrNull,
  getMyQueueEntries,
  isProfileComplete,
  upsertMyProfile,
  type UserProfile,
} from "@/lib/supabase-utils";
import type { Booking, QueueItem } from "@/type";

export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<{ id: string; url: string }[]>([]);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueItem[]>([]);

  const complete = isProfileComplete(profile);
  const selectedAvatarUrl = useMemo(() => {
    if (!avatarId) return null;
    const direct = avatars.find((a) => a.id === avatarId)?.url;
    if (direct) return direct;
    // Back-compat: if stored avatar_id is a filename, match by URL suffix
    const bySuffix = avatars.find((a) => a.url?.endsWith(`/avatars/${avatarId}`))?.url;
    return bySuffix || null;
  }, [avatarId, avatars]);

  const bookingStatusVariant = (status?: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  const queueStatusVariant = (status?: string) => {
    switch (status) {
      case "waiting":
        return "secondary";
      case "serving":
        return "default";
      case "served":
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = await getAuthUserOrNull();
        if (!user) {
          router.push(`/auth?next=${encodeURIComponent("/profile?next=" + encodeURIComponent(nextUrl))}`);
          return;
        }

        const [p, a] = await Promise.all([getMyProfileOrNull(), getAvatars()]);
        setProfile(p);
        setAvatars(a);

        setName(p?.name || "");
        setPhone(p?.phone_number || "");
        setAvatarId(p?.avatar_id || null);

        try {
          const [b, q] = await Promise.all([getMyBookings(), getMyQueueEntries()]);
          setBookings(b);
          setQueueEntries(q);
        } catch (e: any) {
          console.warn("Could not load booking/queue history:", e?.message);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, nextUrl]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await upsertMyProfile({
        name: name.trim(),
        phone_number: phone.trim(),
        avatar_id: avatarId,
      });
      setProfile(updated);
      toast.success("Profile updated.");

      if (isProfileComplete(updated)) {
        router.push(nextUrl);
      }
    } catch (e: any) {
      if (e?.code === "AUTH_REQUIRED") {
        router.push(`/auth?next=${encodeURIComponent("/profile?next=" + encodeURIComponent(nextUrl))}`);
        return;
      }
      toast.error(e?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">My Profile</CardTitle>
            <CardDescription>
              {complete
                ? "Your profile is ready. You can book and join queues."
                : "Complete your profile to book or join a queue (name + phone required)."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border bg-white p-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border bg-gray-50 flex items-center justify-center">
                {selectedAvatarUrl ? (
                  <Image src={selectedAvatarUrl} alt="Selected avatar" width={64} height={64} className="h-16 w-16 object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">No avatar</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{name?.trim() || "Your name"}</p>
                <p className="text-sm text-muted-foreground truncate">{phone?.trim() || "Your phone number"}</p>
              </div>
              <div className="ml-auto">
                {complete ? (
                  <Badge variant="default">Profile complete</Badge>
                ) : (
                  <Badge variant="secondary">Complete required</Badge>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Phone number <span className="text-red-500">*</span>
                </Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2519..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avatar (optional)</Label>
              {avatars.length === 0 ? (
                <p className="text-xs text-muted-foreground">No avatars configured.</p>
              ) : (
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
                  {avatars.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAvatarId(a.id)}
                      className={`rounded-xl border p-1 transition ${
                        avatarId === a.id ? "border-primary ring-2 ring-primary/30" : "border-gray-200 hover:border-gray-300"
                      }`}
                      aria-label={`Select avatar ${a.id}`}
                    >
                      <Image src={a.url} alt={`avatar ${a.id}`} width={56} height={56} className="rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving || !name.trim() || !phone.trim()}>
                {saving ? "Saving..." : complete ? "Save" : "Save & Continue"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Back home
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">My Activity</CardTitle>
            <CardDescription>Bookings and queues linked to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bookings">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="queue">Queue</TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="mt-4 space-y-3">
                {bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookings yet.</p>
                ) : (
                  bookings.map((b) => (
                    <div key={b.id} className="rounded-xl border p-4 bg-white">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{b.service?.name || "Service"}</p>
                          <p className="text-xs text-muted-foreground truncate">{b.company?.name || "Company"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(b.start_time).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant={bookingStatusVariant(b.status)}>{b.status}</Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => router.push(`/booking/confirmation/${b.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="queue" className="mt-4 space-y-3">
                {queueEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No queue entries yet.</p>
                ) : (
                  queueEntries.map((q: any) => (
                    <div key={q.id} className="rounded-xl border p-4 bg-white">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{q.service?.name || "Service"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {q.company?.name || q.service?.company?.name || "Company"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(q.joined_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={queueStatusVariant(q.status)}>{q.status}</Badge>
                          {q.position != null && (
                            <p className="text-xs text-muted-foreground mt-2">Position: {q.position}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

