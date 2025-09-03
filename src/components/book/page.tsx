// // src/app/services/[serviceId]/book/page.tsx
// "use client"

// import type React from "react"
// import { useState, useEffect, useMemo } from "react"
// import { useParams, useRouter, useSearchParams } from "next/navigation" // Added useSearchParams
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Calendar } from "@/components/ui/calendar"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Added Select components
// import { Clock, MapPin, Phone, Users, CalendarDays, User, ArrowLeft, Home } from "lucide-react" // Added ArrowLeft, Home
// import Image from "next/image"
// import { toast } from "sonner" // For notifications
// import type { Company, Service, Provider, QueueItem } from "@/type"
// import {  ANY_PROVIDER_OPTION } from "@/type" // Using type.ts for ANY_PROVIDER_ID and OPTION
// import { getServiceDetails, createQueueEntry, CreateQueuePayload, getCurrentQueueCount } from "@/lib/supabase-utils"
// import { generateTimeSlots } from "@/lib/time-utils"
// import { ANY_PROVIDER_ID } from "@/lib/constants"
// // Country codes data
// const countryCodes = [
//   { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
//   { code: "+1", country: "United States", flag: "🇺🇸" },
//   { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
//   { code: "+91", country: "India", flag: "🇮🇳" },
//   { code: "+86", country: "China", flag: "🇨🇳" },
//   { code: "+49", country: "Germany", flag: "🇩🇪" },
//   { code: "+33", country: "France", flag: "🇫🇷" },
//   { code: "+81", country: "Japan", flag: "🇯🇵" },
//   { code: "+234", country: "Nigeria", flag: "🇳🇬" },
//   { code: "+27", country: "South Africa", flag: "🇿🇦" },
// ];

// export default function ServiceBookingPage() {
//   const params = useParams()
//   const router = useRouter()
//   const searchParams = useSearchParams() // To get companyId from query

//   const serviceId = params.serviceId as string
//   const companyIdFromUrl = searchParams.get("companyId") // Get companyId from URL query

//   const [service, setService] = useState<Service | null>(null)
//   const [company, setCompany] = useState<Company | null>(null)
//   const [providers, setProviders] = useState<Provider[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   const [bookingType, setBookingType] = useState<"walk-in" | "booking">("booking")
//   const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
//   const [selectedTime, setSelectedTime] = useState<string>("")
//   const [selectedProviderId, setSelectedProviderId] = useState<string>(ANY_PROVIDER_ID) // Default to 'Any Provider'
//   const [formData, setFormData] = useState({
//     user_name: "",
//     phone_number: "",
//     country_code: "+251", // Default country code
//     notes: "",
//   })
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [submissionSuccess, setSubmissionSuccess] = useState<
//     { type: "booking" | "walk-in"; queuePosition?: number; estimatedWaitTime?: number | null; serviceName: string; appointmentTime?: string } | null
//   >(null)

//   // Fetch service details on component mount
//   useEffect(() => {
//     const fetchServiceData = async () => {
//       try {
//         setLoading(true)
//         setError(null)

//         if (!serviceId) {
//           setError("Service ID is missing from the URL.")
//           toast.error("Service ID is missing.")
//           return
//         }
        
//         // Pass companyId to getServiceDetails if your DB logic requires it for security/filtering
//         // However, getServiceDetails currently only uses serviceId, which is fine
//         const fetchedService = await getServiceDetails(serviceId)

//         if (!fetchedService) {
//           setError("Service not found or is inactive.")
//           toast.error("Service not found.")
//           router.push('/') // Redirect home if service not found
//           return
//         }

//         if (!fetchedService.company) {
//             setError("Company information not found for this service.")
//             toast.error("Company details missing.")
//             router.push('/')
//             return;
//         }

//         setService(fetchedService)
//         setCompany(fetchedService.company)
//         // Ensure ANY_PROVIDER_OPTION is always available
//         const activeProviders = fetchedService.providers?.filter(p => p.is_active) || [];
//         setProviders([ANY_PROVIDER_OPTION, ...activeProviders]);

//       } catch (e) {
//         console.error("Error fetching service details:", e)
//         setError("Failed to load service details. Please try again.")
//         toast.error("Failed to load service details.")
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchServiceData()
//   }, [serviceId, companyIdFromUrl, router])


//   // Generate time slots based on company working hours and service duration
//   const availableTimeSlots = useMemo(() => {
//     if (!company?.working_hours || service?.estimated_wait_time_mins === null) {
//       return []
//     }
//     // Using default values if the fetched data is not available/null
//     const effectiveWorkingHours = company.working_hours || "09:00-17:00"; 
//     const effectiveServiceDuration = service?.estimated_wait_time_mins; 
//     return generateTimeSlots(effectiveWorkingHours, effectiveServiceDuration);
//   }, [company?.working_hours, service?.estimated_wait_time_mins])

//   const handleInputChange = (field: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }))
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!service || !company) {
//         toast.error("Service or company data is missing. Cannot proceed.")
//         return;
//     }

//     if (!formData.user_name || !formData.phone_number || !selectedProviderId) {
//         toast.error("Please fill in all required fields (Name, Phone, Provider).")
//         return;
//     }

//     if (bookingType === "booking" && (!selectedDate || !selectedTime)) {
//         toast.error("Please select a date and time for your appointment.")
//         return;
//     }

//     setIsSubmitting(true)
//     setError(null)

//     try {
//       const fullPhoneNumber = formData.country_code + formData.phone_number;
//       const appointmentTime = bookingType === "booking" && selectedDate && selectedTime
//         ? `${selectedDate.toISOString().split('T')[0]}T${selectedTime}:00Z` // Format as ISO string for DB
//         : null;

//       const payload: CreateQueuePayload = {
//         service_id: service.id,
//         provider_id: selectedProviderId === ANY_PROVIDER_ID ? null : selectedProviderId,
//         user_name: formData.user_name,
//         phone_number: fullPhoneNumber,
//         queue_type: bookingType,
     
//       }

//       const newQueueEntry = await createQueueEntry(payload)

//       if (bookingType === "walk-in") {
//         const estimatedWaitTimePerPerson = service.estimated_wait_time_mins || 15;
//         const estimatedTotalWaitTime = (newQueueEntry.position || 0) * estimatedWaitTimePerPerson;
//         setSubmissionSuccess({
//           type: "walk-in",
//           queuePosition: newQueueEntry.position,
//           estimatedWaitTime: estimatedTotalWaitTime,
//           serviceName: service.name,
//         })
//       } else {
//         setSubmissionSuccess({
//           type: "booking",
//           serviceName: service.name,
//           appointmentTime: `${selectedDate?.toLocaleDateString()} at ${selectedTime}`,
//         })
//       }

//     } catch (e: any) {
//       console.error("Submission failed:", e)
//       setError(e.message || "Failed to submit booking. Please try again.")
//       toast.error(e.message || "Failed to submit booking.")
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
//           <p className="text-muted-foreground">Loading service details...</p>
//         </div>
//       </div>
//     )
//   }

//   if (error || !service || !company) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Service</h1>
//           <p className="text-muted-foreground mb-4">{error || "The service you're looking for doesn't exist or there was an issue fetching its details."}</p>
//           <Button onClick={() => router.back()}>
//             <ArrowLeft className="mr-2 h-4 w-4" />
//             Go Back
//           </Button>
//           <Button onClick={() => router.push('/')} className="ml-2">
//             <Home className="mr-2 h-4 w-4" />
//             Back to Home
//           </Button>
//         </div>
//       </div>
//     )
//   }

//   // If submission was successful, show a confirmation message
//   if (submissionSuccess) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center p-4">
//         <Card className="max-w-md w-full text-center p-6">
//           <CardHeader>
//             <CardTitle className="text-3xl text-green-600">🎉 Success!</CardTitle>
//             <CardDescription className="text-lg mt-2">
//               {submissionSuccess.type === "booking" ? (
//                 <>Your appointment for <strong>{submissionSuccess.serviceName}</strong> has been scheduled!</>
//               ) : (
//                 <>You have joined the queue for <strong>{submissionSuccess.serviceName}</strong>!</>
//               )}
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {submissionSuccess.type === "walk-in" && (
//               <>
//                 <p className="text-xl font-semibold text-blue-600">Your queue position: #{submissionSuccess.queuePosition}</p>
//                 {submissionSuccess.estimatedWaitTime != null && (
//                   <p className="text-md text-gray-700">Estimated wait time: ~{submissionSuccess.estimatedWaitTime} minutes.</p>
//                 )}
//                 <p className="text-sm text-muted-foreground">We'll notify you via SMS when it's your turn!</p>
//               </>
//             )}
//             {submissionSuccess.type === "booking" && (
//               <>
//                 <p className="text-xl font-semibold text-blue-600">On {submissionSuccess.appointmentTime}</p>
//                 <p className="text-sm text-muted-foreground">You will receive an SMS confirmation shortly.</p>
//               </>
//             )}
//             <Button onClick={() => router.push('/dashboard')} className="mt-6 w-full">
//               Go to My Bookings/Dashboard
//             </Button>
//             <Button variant="outline" onClick={() => router.push('/')} className="mt-2 w-full">
//               Back to Home
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <div className="container mx-auto px-4 py-8">
//         <div className="max-w-4xl mx-auto">
//           {/* Service Header Card */}
//           <Card className="mb-8">
//             <CardContent className="p-6">
//               <div className="flex flex-col md:flex-row gap-6">
//                 <div className="flex-shrink-0">
//                   <Image
//                     src={service.photo || "/placeholder.svg?height=200&width=300&query=service image"}
//                     alt={service.name}
//                     width={300}
//                     height={200}
//                     className="rounded-lg object-cover"
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <div className="flex items-start justify-between mb-4">
//                     <div>
//                       <h1 className="text-3xl font-bold text-foreground mb-2">{service.name}</h1>
//                       <p className="text-muted-foreground mb-4">{service.description}</p>
//                     </div>
//                     <Badge variant="secondary" className="text-lg px-3 py-1">
//                       {service.price}
//                     </Badge>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                     <div className="flex items-center gap-2 text-muted-foreground">
//                       <Clock className="h-4 w-4" />
//                       <span>Estimated time: {service.estimated_wait_time_mins || 30} minutes</span>
//                     </div>
//                     <div className="flex items-center gap-2 text-muted-foreground">
//                       <MapPin className="h-4 w-4" />
//                       <span>{company.name}</span>
//                     </div>
//                     <div className="flex items-center gap-2 text-muted-foreground">
//                       <Phone className="h-4 w-4" />
//                       <span>{company.phone || "N/A"}</span>
//                     </div>
//                     <div className="flex items-center gap-2 text-muted-foreground">
//                       <Users className="h-4 w-4" />
//                       <span>Code: {service.code || "N/A"}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Booking Form Card */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Book Your Service</CardTitle>
//               <CardDescription>Choose your preferred booking method and provide your details</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <form onSubmit={handleSubmit} className="space-y-6">
//                 <Tabs value={bookingType} onValueChange={(value) => setBookingType(value as "walk-in" | "booking")}>
//                   <TabsList className="grid w-full grid-cols-2">
//                     <TabsTrigger value="booking" className="flex items-center gap-2">
//                       <CalendarDays className="h-4 w-4" />
//                       Schedule Appointment
//                     </TabsTrigger>
//                     <TabsTrigger value="walk-in" className="flex items-center gap-2">
//                       <Users className="h-4 w-4" />
//                       Join Queue
//                     </TabsTrigger>
//                   </TabsList>

//                   <TabsContent value="booking" className="space-y-6">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <Label className="text-base font-semibold mb-3 block">Select Date</Label>
//                         <Calendar
//                           mode="single"
//                           selected={selectedDate}
//                           onSelect={setSelectedDate}
//                           disabled={(date) => date < new Date()} // Disable past dates
//                           className="rounded-md border"
//                         />
//                       </div>
//                       <div>
//                         <Label className="text-base font-semibold mb-3 block">Select Time</Label>
//                         <div className="grid grid-cols-3 gap-2">
//                           {availableTimeSlots.length > 0 ? (
//                             availableTimeSlots.map((time) => (
//                               <Button
//                                 key={time}
//                                 type="button"
//                                 variant={selectedTime === time ? "default" : "outline"}
//                                 size="sm"
//                                 onClick={() => setSelectedTime(time)}
//                                 className="text-xs"
//                               >
//                                 {time}
//                               </Button>
//                             ))
//                           ) : (
//                             <p className="col-span-3 text-sm text-muted-foreground">No available time slots.</p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </TabsContent>

//                   <TabsContent value="walk-in">
//                     <div className="bg-muted/50 rounded-lg p-4">
//                       <h3 className="font-semibold text-foreground mb-2">Join the Queue</h3>
//                       <p className="text-sm text-muted-foreground">
//                         You'll be added to the walk-in queue and will be served based on your position. Estimated wait
//                         time: <strong>~{service.estimated_wait_time_mins || 15} minutes per person</strong>
//                       </p>
//                     </div>
//                   </TabsContent>
//                 </Tabs>

//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold text-foreground">Choose Your Provider</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     {providers
//                       .filter((provider) => provider.is_active || provider.isAny) // Show only active providers + "Any Provider" option
//                       .map((provider: Provider) => (
//                         <Card
//                           key={provider.id}
//                           className={`cursor-pointer transition-all hover:shadow-md ${
//                             selectedProviderId === provider.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
//                           }`}
//                           onClick={() => setSelectedProviderId(provider.id)}
//                         >
//                           <CardContent className="p-4">
//                             <div className="flex items-center gap-3">
//                               <div className="flex-shrink-0">
//                                 <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
//                                   <User className="h-5 w-5 text-primary" />
//                                 </div>
//                               </div>
//                               <div className="flex-1">
//                                 <h4 className="font-semibold text-foreground">{provider.name}</h4>
//                                 <p className="text-sm text-muted-foreground">{provider.specialization || "N/A"}</p>
//                               </div>
//                               {provider.isAny && (
//                                 <Badge variant="secondary" className="text-xs">
//                                   Recommended
//                                 </Badge>
//                               )}
//                             </div>
//                           </CardContent>
//                         </Card>
//                       ))}
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold text-foreground">Your Information</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <Label htmlFor="user_name">Full Name *</Label>
//                       <Input
//                         id="user_name"
//                         value={formData.user_name}
//                         onChange={(e) => handleInputChange("user_name", e.target.value)}
//                         placeholder="Enter your full name"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <Label htmlFor="phone_number">Phone Number *</Label>
//                       <div className="flex gap-2">
//                         <Select value={formData.country_code} onValueChange={(value) => handleInputChange("country_code", value)}>
//                           <SelectTrigger className="w-[140px]">
//                             <SelectValue placeholder="Code" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {countryCodes.map((country) => (
//                               <SelectItem key={country.code} value={country.code}>
//                                 {country.flag} {country.code}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <Input
//                           id="phone_number"
//                           type="tel"
//                           value={formData.phone_number}
//                           onChange={(e) => handleInputChange("phone_number", e.target.value)}
//                           placeholder="912345678"
//                           required
//                           className="flex-1"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                   <div>
//                     <Label htmlFor="notes">Additional Notes (Optional)</Label>
//                     <input
//                       id="notes"
//                       value={formData.notes}
//                       onChange={(e) => handleInputChange("notes", e.target.value)}
//                       placeholder="Any special requests or notes..."
                    
//                     />
//                   </div>
//                 </div>

//                 <div className="flex gap-4">
//                   <Button type="button" variant="outline" onClick={() => router.back()}>
//                     Cancel
//                   </Button>
//                   <Button
//                     type="submit"
//                     className="flex-1"
//                     disabled={
//                       isSubmitting ||
//                       !formData.user_name ||
//                       !formData.phone_number ||
//                       !selectedProviderId ||
//                       (bookingType === "booking" && (!selectedDate || !selectedTime))
//                     }
//                   >
//                     {isSubmitting ? "Submitting..." : (bookingType === "booking" ? "Schedule Appointment" : "Join Queue")}
//                   </Button>
//                 </div>
//               </form>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }