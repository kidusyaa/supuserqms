"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Loader2 } from "lucide-react"; // <-- Import a spinner icon

import { JoinQueueDialog } from "@/app/services/[servicesId]/book/_componet/JoinQueueDialog";
import BookServiceDialog from "@/app/services/[servicesId]/book/_componet/BookServiceDialog";
import { getServiceWithProviders, getCompanyById } from "@/lib/firebase-utils";
import { Service, Provider, Company, ANY_PROVIDER_OPTION } from "@/type";
import { ANY_PROVIDER_ID } from "@/lib/constants";

export default function BookServicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const serviceId = params.servicesId as string;
  const companyId = searchParams.get("companyId") || "";
  const providerId = searchParams.get("providerId");

  const [mode, setMode] = useState<"queue" | "book" | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!companyId || !serviceId || !providerId) {
      setError("Missing required information.");
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      try {
        const [serviceData, companyData] = await Promise.all([
            getServiceWithProviders(companyId, serviceId),
            getCompanyById(companyId)
        ]);
        
        if (!serviceData || !companyData) {
          setError("Service or company not found.");
          return;
        }
        setService(serviceData);
        setCompany(companyData);

        if (providerId === ANY_PROVIDER_ID) {
          setSelectedProvider(ANY_PROVIDER_OPTION);
        } else {
          const provider = serviceData.providers?.find((p) => p.id === providerId);
          if (provider) {
            setSelectedProvider(provider);
          } else {
            setError("The selected provider could not be found.");
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
  }, [companyId, serviceId, providerId]);

  // --- FIX: Implement the loading state UI ---
  // This check now runs first and stops anything else from rendering.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="flex items-center gap-3 text-lg text-slate-600">
          <Loader2 className="animate-spin h-8 w-8" />
          <span>Loading Booking Details...</span>
        </div>
      </div>
    );
  }

  // The error state UI
  if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg max-w-md mx-auto mt-10">
        {error}
      </div>
    );
  }

  // This check is now a final "catch-all" for any unexpected issues
  if (!service || !selectedProvider || !company) {
    return (
      <div className="p-8 text-center text-slate-600">
        Could not load booking details. Please try again later.
      </div>
    );
  }

  // --- Main UI ---
  // This part will only render when loading is false AND there is no error.
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

      {/* Dialogs */}
      <JoinQueueDialog
        open={mode === "queue"}
        onOpenChange={(isOpen) => !isOpen && setMode(null)}
        service={service}
        company={company}
        selectedProvider={selectedProvider}
      />
      <BookServiceDialog
        open={mode === "book"}
        onOpenChange={(isOpen) => !isOpen && setMode(null)}
        service={service}
        company={company}
        selectedProvider={selectedProvider}
      />
    </div>
  );
}