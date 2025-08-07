"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { JoinQueueDialog } from "@/components/JoinQueueDialog";
import BookServiceDialog from "@/components/BookServiceDialog";
import { getServiceWithProviders } from "@/lib/firebase-utils";

// --- KEY IMPORTS ---
import { Service, Provider, ANY_PROVIDER_OPTION } from "@/type"; // <-- Import the virtual provider option
import { ANY_PROVIDER_ID } from "@/lib/constants"; // <-- Import the special ID constant

export default function BookServicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const serviceId = params.servicesId as string;
  const companyId = searchParams.get("companyId") || "";
  const providerId = searchParams.get("providerId");

  const [mode, setMode] = useState<"queue" | "book" | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!companyId || !serviceId || !providerId) {
      setError("Missing required information (company, service, or provider).");
      setLoading(false);
      return;
    }

    const fetchServiceAndProvider = async () => {
      setLoading(true);
      setError("");
      try {
        // Step 1: Always fetch the service data. We need it in both cases.
        const serviceData = await getServiceWithProviders(companyId, serviceId);
        if (!serviceData) {
          setError("Service not found.");
          return; // The 'finally' block will still run
        }
        setService(serviceData);

        // --- Step 2: THIS IS THE CORE LOGIC CHANGE ---
        // Check if the user chose "Any Available"
        if (providerId === ANY_PROVIDER_ID) {
          // If yes, use our pre-defined virtual provider object.
          // This object has a .name, .id, etc., so the rest of the page works seamlessly.
          setSelectedProvider(ANY_PROVIDER_OPTION);
        } else {
          // If no, it's a specific provider. Find them in the list.
          const provider = serviceData.providers?.find((p) => p.id === providerId);
          if (provider) {
            setSelectedProvider(provider);
          } else {
            // This error now only triggers for a *genuinely* invalid provider ID.
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

    fetchServiceAndProvider();
  }, [companyId, serviceId, providerId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-500">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg max-w-md mx-auto mt-10">{error}</div>;
  }

  // This check now works for both real providers and the "Any Provider" option
  if (!service || !selectedProvider) {
    return <div className="p-8 text-center text-slate-600">Could not load booking details.</div>;
  }

  // --- Main UI (No changes needed here!) ---
  // The rest of your component works perfectly because `selectedProvider.name`
  // will be "Any Available Specialist" when providerId is 'any'.
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

      {/* --- Dialogs (No changes needed here) --- */}
      {/* These dialogs will now receive the correct `selectedProvider` object */}
      <JoinQueueDialog
        open={mode === "queue"}
        onOpenChange={(isOpen) => !isOpen && setMode(null)}
        service={service}
        companyId={companyId}
        selectedProvider={selectedProvider} // This will be ANY_PROVIDER_OPTION when needed
      />
      <BookServiceDialog
        open={mode === "book"}
        onOpenChange={(isOpen) => !isOpen && setMode(null)}
        companyId={companyId}
        serviceId={serviceId}
        providerId={selectedProvider.id} // This will be 'any' when needed
      />
    </div>
  );
}