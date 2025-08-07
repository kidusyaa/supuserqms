"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getServiceWithProviders } from "@/lib/firebase-utils";
import { Service, Provider } from "@/type";
// We don't need the JoinQueueDialog or Button for this display-only component
// import { JoinQueueDialog } from "@/components/JoinQueueDialog";
// import { Button } from "@/components/ui/button";

// A wrapper component is needed for useSearchParams to work with Suspense
function ServiceDetailContent() {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Get IDs from URL
  const serviceId = params.serviceId as string;
  const companyId = searchParams.get("companyId");

  // This data fetching logic is already correct and robust. No changes needed here.
  useEffect(() => {
    const loadService = async () => {
      // Guard Clause: Don't run the fetch if the IDs are not ready yet.
      if (!companyId || !serviceId) {
        return;
      }

      setIsLoading(true); // Set loading to true before fetching
      try {
        const data = await getServiceWithProviders(companyId, serviceId);
        if (data) {
          setService(data);
          // If there's only one provider, auto-select them.
          if (data.providers && data.providers.length === 1) {
            setSelectedProvider(data.providers[0]);
          }
        } else {
          setError(`Service with ID "${serviceId}" not found for the given company.`);
        }
      } catch (err) {
        console.error("A critical error occurred while fetching:", err);
        setError("Failed to load service details. Please try again later.");
      } finally {
        setIsLoading(false); // Always stop loading after the attempt.
      }
    };

    loadService();
  }, [companyId, serviceId]); // Dependency array is correct.

  // --- Render States ---

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Service...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;
  }

  if (!service) {
    // This state is hit if the fetch completes but returns null/undefined.
    return <div className="p-8 text-center">Service details could not be loaded.</div>;
  }

  // --- Main Component JSX (Cleaned Up) ---
  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-blue-600 hover:underline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Services
      </button>

      {/* Service Info Card */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">{service.name}</h1>
        <p className="text-lg text-gray-600 mb-4">{service.description}</p>
        <div className="flex items-center space-x-6 text-lg">
          <span className="font-bold text-green-600">${service.price}</span>
          <span>•</span>
          <span>Estimated Wait: ~{service.estimatedWaitTime} minutes</span>
        </div>
      </div>

      {/* Providers Section */}
      {service.providers && service.providers.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {service.providers.length > 1 ? "Select a Provider" : "Your Assigned Provider"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {service.providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider)}
                className={`p-4 border rounded-lg text-center transition-all duration-200 ${
                  selectedProvider?.id === provider.id
                    ? "bg-blue-500 text-white ring-2 ring-blue-500 ring-offset-2"
                    : "bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                }`}
              >
                <p className="font-semibold text-lg">{provider.name}</p>
                <p className={`text-sm ${selectedProvider?.id === provider.id ? 'text-blue-100' : 'text-gray-500'}`}>
                   Status: {provider.name}
                </p>
              </button>
            ))}
          </div>
           {/* This is a good place to add the "Join Queue" button when you are ready */}
           {/* For now, it's removed as requested */}
        </div>
      ) : (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No specific providers are listed for this service.</p>
            {/* You could still have a "Join Queue" button here for services without providers */}
        </div>
      )}

      {/* 
        ===========================================================
        JOIN QUEUE SECTION REMOVED
        
        When you are ready to add it back, you would place the 
        <Button> and <JoinQueueDialog> components here.
        ===========================================================
      */}
      
    </div>
  );
}

// The main page component must be wrapped in Suspense for useSearchParams to work reliably
const ServiceDetailPage = () => {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center text-gray-500">Loading Page...</div>}>
      <ServiceDetailContent />
    </Suspense>
  );
};

export default ServiceDetailPage;