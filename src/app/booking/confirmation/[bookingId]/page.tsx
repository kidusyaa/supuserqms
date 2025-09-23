"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBookingDetails } from "@/lib/supabase-utils"; // Make sure this function exists
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { Booking } from "@/type";

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = params.bookingId as string;

  useEffect(() => {
    if (!bookingId) {
      setError("Booking ID is missing.");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      setLoading(true);
      try {
        const data = await getBookingDetails(bookingId);
        if (!data) {
          throw new Error("Booking not found.");
        }
        setBooking(data);
      } catch (err: any) {
        console.error("Failed to fetch booking:", err);
        setError(err.message || "Could not load booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error || "Could not find your booking."}</p>
          <Button onClick={() => router.push('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const startDate = parseISO(booking.start_time);
  const endDate = parseISO(booking.end_time);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-green-600">
              <span className="mr-2">🎉</span>Booking Confirmed!
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Your appointment has been successfully scheduled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4 border-b pb-4">
              <Image
                src={booking.service?.photo || "/placeholder.svg?height=80&width=80"}
                alt={booking.service?.name || "Service"}
                width={80}
                height={80}
                className="rounded-md object-cover"
              />
              <div>
                <p className="text-xl font-semibold">{booking.service?.name}</p>
                <p className="text-md text-muted-foreground">{booking.company?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Appointment ID</p>
                <p className="font-medium">{booking.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize text-green-700">{booking.status}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{format(startDate, 'PPPP')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-medium">{format(startDate, 'p')} - {format(endDate, 'p')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Provider</p>
                <p className="font-medium">{booking.provider?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{booking.service?.estimated_wait_time_mins} minutes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Booked By</p>
                <p className="font-medium">{booking.user_name}</p>
              </div>
              {booking.phone_number && (
                <div>
                  <p className="text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{booking.phone_number}</p>
                </div>
              )}
            </div>

            {booking.notes && (
              <div>
                <p className="text-muted-foreground">Notes</p>
                <p className="font-medium italic">{booking.notes}</p>
              </div>
            )}

            <div className="text-center mt-8 space-x-4">
              <Button onClick={() => router.push('/')}>
                Back to Home
              </Button>
              {/* You might add a button here to view all bookings for a user if authenticated */}
              {/* <Button variant="outline" onClick={() => router.push('/my-bookings')}>
                View My Bookings
              </Button> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}