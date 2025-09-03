// CompanyDetailPage.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import { MapPin, Phone, Mail, Clock, Globe, Facebook, Instagram, ArrowLeft, ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Company, Service } from "@/type"
import { getCompanyWithServices } from "@/lib/supabase-utils"
// REMOVED: import { ANY_PROVIDER_ID } from "@/lib/constants" as it's not needed here anymore

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  
  const companyId = params.id as string; 

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true)
        if (!companyId) {
          toast.error("Company ID is missing from URL.")
          router.push('/')
          return
        }
        const companyData = await getCompanyWithServices(companyId)

        if (!companyData) {
          toast.error("Company not found")
          router.push('/')
          return
        }

        setCompany(companyData)
      } catch (error) {
        console.error('Error fetching company data:', error)
        toast.error("Failed to load company details")
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchCompanyData()
    }
  }, [companyId, router])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const serviceId = urlParams.get('serviceId')
    setSelectedServiceId(serviceId)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading company details...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Company not found</h2>
          <p className="text-muted-foreground mb-4">The company you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    )
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
            <span className="text-gray-900 font-medium">{company?.name}</span>
          </nav>
        </div>
      </div>

      {/* Back button */}
      <div className="container mx-auto px-4 pt-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Header with company info */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <Image
                  src={company.logo || "/placeholder-company.png"}
                  alt={company.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
                  <Badge variant="outline" className="text-sm">
                    Open Now
                  </Badge>
                </div>
                {company.location_text && (
                  <p className="text-muted-foreground">{company.location_text}</p>
                )}
                
                <div className="flex items-center space-x-4 pt-2">
                  {company.socials?.website && (
                    <Link href={company.socials.website} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon">
                        <Globe className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                  {company.socials?.facebook && (
                    <Link href={company.socials.facebook} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon">
                        <Facebook className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                  {company.socials?.instagram && (
                    <Link href={company.socials.instagram} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon">
                        <Instagram className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {company.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{company.address}</p>
                      {company.location_link && (
                        <a 
                          href={company.location_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View on Map
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {company.phone && (
                  <div className="flex items-start space-x-2">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <a 
                        href={`tel:${company.phone}`} 
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        {company.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {company.email && (
                  <div className="flex items-start space-x-2">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <a 
                        href={`mailto:${company.email}`} 
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        {company.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {company.working_hours && (
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Working Hours</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {company.working_hours}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Service Highlight (removed providerId from Link) */}
      {selectedServiceId && company.services && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="container mx-auto px-4 py-8">
            {(() => {
              const selectedService = company.services.find(s => s.id === selectedServiceId)
              if (!selectedService) return null

              return (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0">
                        <Image
                          src={selectedService.photo || "/placeholder-service.png"}
                          alt={selectedService.name}
                          width={120}
                          height={120}
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedService.name}</h3>
                            <p className="text-gray-600 mb-3">{selectedService.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span><strong className="text-green-600">{selectedService.price}</strong></span>
                              <span>~{selectedService.estimated_wait_time_mins} min</span>
                            </div>
                          </div>
                          <Badge variant="default" className="bg-blue-500">
                            Selected Service
                          </Badge>
                        </div>
                        <div className="flex gap-3">
                          {/* FIX: Use /booking/[serviceId] path */}
                          <Link href={`/booking/${selectedService.id}`}>
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                              Book This Service
                            </Button>
                          </Link>
                          {/* If "View Details" should also lead to the booking page: */}
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => router.push(`/booking/${selectedService.id}`)} // This was already correct
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Services Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Our Services</h2>
          <p className="text-muted-foreground">Choose from our range of professional services</p>
        </div>

        {company.services && company.services.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {company.services.map((service) => (
              <Card
                key={service.id}
                className={`overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full ${
                  selectedServiceId === service.id
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : ''
                }`}
              >
                <div className="relative h-48 bg-muted">
                  <Image
                    src={service.photo || "/placeholder-service.png"}
                    alt={service.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        {service.code && (
                          <CardDescription>{service.code}</CardDescription>
                        )}
                      </div>
                      {service.price && (
                        <Badge variant="outline" className="shrink-0">
                          {service.price}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {service.description}
                      </p>
                    )}
                    <div className="mt-auto pt-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          {service.estimated_wait_time_mins != null && service.estimated_wait_time_mins > 0 ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              ~{service.estimated_wait_time_mins} min
                            </div>
                          ) : null}
                          {service.status === 'active' ? (
                            <Badge variant="outline" className="text-xs">
                              Available Now
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Not Available
                            </Badge>
                          )}
                        </div>
                        {/* FIX: Use /booking/[serviceId] path */}
                        <Link href={`/booking/${service.id}`} className="shrink-0">
                          <Button
                            size="sm"
                            disabled={service.status !== 'active'}
                            className={selectedServiceId === service.id ? 'bg-blue-600 hover:bg-blue-700' : ''}
                          >
                            {service.status === 'active'
                              ? (selectedServiceId === service.id ? 'Continue Booking' : 'Book Now')
                              : 'Not Available'
                            }
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No services available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}