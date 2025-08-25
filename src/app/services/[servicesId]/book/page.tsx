// src/app/services/[servicesId]/book/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { JoinQueueDialog } from "./_componet/JoinQueueDialog";
import BookServiceDialog from "./_componet/BookServiceDialog";
import { Service, Provider, Company, ANY_PROVIDER_OPTION } from "@/type";
import { ANY_PROVIDER_ID } from "@/lib/constants";
// --- THE FIX: Import the correct Supabase function ---
import { getServiceDetails } from "@/lib/supabase-utils"; 

export default function BookServicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const serviceId = params.servicesId as string;
  // We still need providerId from the previous page's selection
  const providerId = searchParams.get("providerId");

  const [mode, setMode] = useState<"queue" | "book" | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!serviceId || !providerId) {
      setError("Missing required service or provider information.");
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      try {
        // --- THE FIX: One single, efficient API call ---
        const serviceData = await getServiceDetails(serviceId);
        
        if (!serviceData) {
          setError("Service not found.");
          return;
        }
        setService(serviceData);

        // Provider logic remains the same
        if (providerId === ANY_PROVIDER_ID) {
          setSelectedProvider(ANY_PROVIDER_OPTION);
        } else {
          const provider = serviceData.providers?.find((p) => p.id === providerId);
          if (provider) {
            setSelectedProvider(provider);
          } else {
            setError("The selected provider could not be found for this service.");
          }
        }
      } catch (e) {
        console.error("Failed to load service info:", e);
        setError("Failed to load service information.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [serviceId, providerId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-500">Loading Booking Options...</div>;
  }
  
  if (error) {
    return <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg max-w-md mx-auto mt-10 font-semibold">{error}</div>;
  }

  // --- THE FIX: Check for service and its embedded company object ---
  if (!service || !selectedProvider || !service.company) {
    return <div className="p-8 text-center text-slate-600">Could not load booking details.</div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 flex justify-center items-start">
      <div className="w-full max-w-lg">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-blue-900 transition-colors"
        >
          <Icon icon="lucide:arrow-left" width="20" height="20" />
          Back to Service Details
        </button>
        
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-800">Choose Your Action</h1>
          <p className="text-slate-600 mt-2 mb-1">
            Service: <span className="font-semibold">{service.name}</span>
          </p>
          <p className="text-slate-600 mb-6">
            With: <span className="font-semibold">{selectedProvider.name}</span>
          </p>
          
          <div className="space-y-4">
            <button
              className="w-full flex items-center justify-center gap-3 text-lg font-bold py-4 rounded-lg bg-green-900 text-white/90 hover:bg-green-700 transition-all"
              onClick={() => setMode("queue")}
            >
              <Icon icon="lucide:users" />
              Join Queue Now
            </button>
            <button
              className="w-full flex items-center justify-center gap-3 text-lg font-bold py-4 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-all"
              onClick={() => setMode("book")}
            >
              <Icon icon="lucide:calendar-plus" />
              Schedule an Appointment
            </button>
          </div>
        </div>
      </div>

      <JoinQueueDialog
        open={mode === "queue"}
        onOpenChange={(isOpen) => !isOpen && setMode(null)}
        service={service}
        company={service.company} // Pass company from service object
        selectedProvider={selectedProvider}
      />
      <BookServiceDialog
        open={mode === "book"}
        onOpenChange={(isOpen) => !isOpen && setMode(null)}
        service={service}
        company={service.company} // Pass company from service object
        selectedProvider={selectedProvider}
      />
    </div>
  );
}