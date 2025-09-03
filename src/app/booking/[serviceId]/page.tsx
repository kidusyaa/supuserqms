"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Phone, Users, CalendarDays, User, ChevronRight, Home, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Service, Provider } from "@/type"
import { getCurrentQueueCount, getServiceDetails,  } from "@/lib/supabase-utils"
import BookServiceDialog from "@/components/book/_componet/BookServiceDialog"
import { JoinQueueDialog } from "@/components/book/_componet/JoinQueueDialog"
export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [queueCount, setQueueCount] = useState<number>(0)
  const [joinQueueDialogOpen, setJoinQueueDialogOpen] = useState(false)
  const [bookServiceDialogOpen, setBookServiceDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [error, setError] = useState<string | null>(null); // State to hold error messages

  useEffect(() => {
    const fetchServiceData = async () => {
      setLoading(true);
      setError(null); // Clear previous errors

     const serviceId = params.serviceId as string; 
      if (!serviceId) {
        console.error("Service ID is missing from URL parameters.");
        setError("Service ID is missing.");
        setLoading(false);
        return;
      }

       try {
        console.log(`Attempting to fetch service details for ID: ${serviceId}`);
        const serviceData = await getServiceDetails(serviceId);

        if (!serviceData) {
          console.error(`Service not found or inactive for ID: ${serviceId}`);
          // You could fetch all services here for debugging, but be mindful of performance.
          // console.log('Available services in database:', await getAllServices().then(services => services.map(s => s.id)))
          setService(null); // Ensure service is null
          setError("The service you're looking for doesn't exist or is inactive.");
          setLoading(false);
          return;
        }

        const count = await getCurrentQueueCount(serviceId);
        setQueueCount(count);
        setService(serviceData);

        const activeProviders = serviceData.providers?.filter(p => p.is_active) || [];
        if (activeProviders.length > 0) {
          const anyProvider = activeProviders.find(p => p.isAny);
          setSelectedProvider(anyProvider ? anyProvider.id : activeProviders[0].id);
        } else {
          setSelectedProvider("");
        }

      } catch (err) {
        console.error('Error fetching service data:', err);
        setError("An unexpected error occurred while loading service details.");
        setService(null); // Ensure service is null on error
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [params.serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error) { // Display error message
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!service) { // Fallback if no service after loading (should be covered by error now)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Service Not Found</h1>
          <p className="text-muted-foreground mb-4">The service you're looking for doesn't exist or is inactive.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="flex items-center hover:text-blue-600">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/services" className="hover:text-blue-600">
              Services
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/company/${service.company?.id}`} className="hover:text-blue-600">
              {service.company?.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{service.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Image
                    src={service.photo || "/placeholder.svg?height=200&width=300&query=service image"}
                    alt={service.name}
                    width={300}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">{service.name}</h1>
                      <p className="text-muted-foreground mb-4">{service.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {service.price}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Base time: {service.estimated_wait_time_mins} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Current queue: {queueCount} people</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 col-span-2">
                      <Clock className="h-4 w-4" />
                      <span>Estimated wait: {Math.max(service.estimated_wait_time_mins, queueCount * service.estimated_wait_time_mins)} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{service.company?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{service.company?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Code: {service.code}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Book Your Service</CardTitle>
              <CardDescription>Choose your preferred booking method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setBookServiceDialogOpen(true)}>
                    <CardContent className="p-6 text-center">
                      <CalendarDays className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="text-lg font-semibold mb-2">Schedule Appointment</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Book a specific date and time for your service
                      </p>
                      <Button className="w-full">Book Appointment</Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setJoinQueueDialogOpen(true)}>
                    <CardContent className="p-6 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="text-lg font-semibold mb-2">Join Queue</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Join the walk-in queue. Current queue: {queueCount} people
                      </p>
                      <div className="text-sm text-orange-600 mb-4">
                        Est. wait: {Math.max(service.estimated_wait_time_mins, (queueCount + 1) * service.estimated_wait_time_mins)} min
                      </div>
                      <Button variant="outline" className="w-full">Join Queue</Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Choose Your Provider</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {service.providers && service.providers.length > 0 ? (
                      service.providers
                        .filter((provider) => provider.is_active)
                        .map((provider: Provider) => (
                        <Card
                          key={provider.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedProvider === provider.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedProvider(provider.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">{provider.name}</h4>
                                <p className="text-sm text-muted-foreground">{provider.specialization}</p>
                              </div>
                              {provider.isAny && (
                                <Badge variant="secondary" className="text-xs">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        <p>No providers available for this service at the moment.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => router.back()}>
                    Back to Company
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Components */}
      <JoinQueueDialog
        open={joinQueueDialogOpen}
        onOpenChange={setJoinQueueDialogOpen}
        service={service!}
        company={service!.company!}
        selectedProvider={service!.providers?.find(p => p.id === selectedProvider) || service!.providers?.[0]!}
      />

      <BookServiceDialog
        open={bookServiceDialogOpen}
        onOpenChange={setBookServiceDialogOpen}
        service={service!}
        company={service!.company!}
        selectedProvider={service!.providers?.find(p => p.id === selectedProvider) || service!.providers?.[0]!}
      />
    </div>
  )
}
