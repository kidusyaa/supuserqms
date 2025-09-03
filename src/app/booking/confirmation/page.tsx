"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingType = searchParams.get("type")
  const serviceName = searchParams.get("service")

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-foreground">Booking Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {bookingType === "booking" ? (
                <Calendar className="h-5 w-5 text-primary" />
              ) : (
                <Users className="h-5 w-5 text-primary" />
              )}
              <span className="font-semibold">
                {bookingType === "booking" ? "Appointment Scheduled" : "Added to Queue"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Service: <strong>{serviceName}</strong>
            </p>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            {bookingType === "booking" ? (
              <p>
                Your appointment has been scheduled successfully. You'll receive a confirmation message shortly with all
                the details.
              </p>
            ) : (
              <p>You've been added to the queue. You'll receive updates about your position and estimated wait time.</p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Link href="/">
              <Button className="w-full">Back to Home</Button>
            </Link>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Book Another Service
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
