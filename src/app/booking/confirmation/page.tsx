// booking/confirmation/page.tsx
"use client";

import { CheckCircle, Clock, CalendarCheck, ArrowRight, HomeIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookingConfirmationPage() {
  // In a more advanced setup, you might pass booking/queue IDs via URL params
  // or local storage to display specific details. For now, it's generic.

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="pt-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-20 w-20 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Confirmation Successful!</CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            Thank you for using our service.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <p className="text-gray-700 mb-6">
            Your request has been successfully processed. You will receive further details via SMS or email shortly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="p-4 bg-white shadow-sm border border-gray-200">
              <div className="flex items-center justify-center text-blue-600 mb-2">
                <CalendarCheck className="h-8 w-8 mr-2" />
                <span className="text-xl font-semibold">Appointment</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                For scheduled bookings, keep an eye on your chosen date and time.
              </p>
              <Button asChild variant="outline" className="w-full text-blue-600 border-blue-600 hover:bg-blue-50">
                <Link href="/company">
                  View My Appointments <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>

            <Card className="p-4 bg-white shadow-sm border border-gray-200">
              <div className="flex items-center justify-center text-purple-600 mb-2">
                <Clock className="h-8 w-8 mr-2" />
                <span className="text-xl font-semibold">Queue</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                For queue entries, you'll be notified when it's your turn.
              </p>
              <Button asChild variant="outline" className="w-full text-purple-600 border-purple-600 hover:bg-purple-50">
                <Link href="/services">
                  Check Queue Status <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </div>

          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white w-full">
            <Link href="/">
              <HomeIcon className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}