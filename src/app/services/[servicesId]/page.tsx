"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { getServiceWithProviders, getCompanyById } from "@/lib/firebase-utils";

// --- KEY CHANGE: CLEANER IMPORTS ---
// We import Provider and our shared ANY_PROVIDER_OPTION constant from the same type definition file.
import { Service, Provider, Company, ANY_PROVIDER_OPTION } from "@/type";

// The local 'SelectionOption' type is no longer needed.

function ServiceDetailContent() {
  const [service, setService] = useState<Service | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // --- The state is now simpler, using the Provider type directly ---
  // This works because ANY_PROVIDER_OPTION now conforms to the Provider shape.
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const serviceId = params.servicesId as string;
  const companyId = searchParams.get("companyId");

  // The local definition of ANY_PROVIDER_OPTION has been removed, as it's now imported.

  useEffect(() => {
    const loadData = async () => {
      if (!companyId || !serviceId) {
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        const [serviceData, companyData] = await Promise.all([
          getServiceWithProviders(companyId, serviceId),
          getCompanyById(companyId)
        ]);

        if (serviceData) {
          setService(serviceData);
          // Default selection logic remains the same and now works perfectly.
          if (serviceData.providers && serviceData.providers.length === 1) {
            setSelectedProvider(serviceData.providers[0]);
          } else {
            // Use the globally defined, imported constant.
            setSelectedProvider(ANY_PROVIDER_OPTION);
          }
        } else {
          setError(`This service is inactive or not available.`);
        }

        if (companyData) {
          setCompany(companyData);
        } else {
          setError(prev => prev + " Company data not found.");
        }
      } catch (err) {
        console.error("Failed to fetch service/company details:", err);
        setError("An unexpected error occurred. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [companyId, serviceId]);

  const handleBooking = () => {
    // This logic is now simpler, as a selection is always present after loading.
    if (!selectedProvider) {
      alert("An error occurred. Please refresh and try again.");
      return;
    }
    router.push(`/services/${serviceId}/book?companyId=${companyId}&providerId=${selectedProvider.id}`);
  };

  // --- Render States ---
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-500">Loading Service Details...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg max-w-md mx-auto mt-10 font-semibold">{error}</div>;
  }

  if (!service || !company) {
    return <div className="p-8 text-center text-slate-600">Service or company details could not be loaded.</div>;
  }

  // --- Main Component JSX ---
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto max-w-3xl p-4 md:p-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-blue-900 transition-colors"
        >
          <Icon icon="lucide:arrow-left" width="20" height="20" />
          Back to Services
        </button>

        {/* --- Main Information Card (Unchanged) --- */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200">
          <div>
            <span className="text-sm font-semibold text-blue-900 uppercase tracking-wider">{company.name}</span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mt-1 mb-4">{service.name}</h1>
            <p className="text-slate-600 text-lg mb-6">{service.description}</p>
            <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="flex items-center gap-3"><Icon icon="lucide:dollar-sign" width="20" height="20" /><span className="text-2xl font-bold text-green-600">${service.price}</span></div>
                <div className="flex items-center gap-3 text-slate-700"><Icon icon="lucide:clock" width="20" height="20" /><span className="text-lg">~{service.estimatedWaitTime} min duration</span></div>
            </div>
          </div>
          <hr className="my-6 border-slate-200" />
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">About {company.name}</h2>
            <p className="text-slate-600 mb-2">{company.address}</p>
            <p className="text-slate-600">Phone: <a href={`tel:${company.phone}`} className="text-blue-900 hover:underline">{company.phone}</a></p>
          </div>
        </div>

        {/* --- Providers Section --- */}
        {service.providers && service.providers.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Choose Your Specialist</h2>
            <p className="text-slate-600 mb-4 -mt-2">
                "{ANY_PROVIDER_OPTION.name}" is selected by default. Click a specialist to choose them instead.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                key={ANY_PROVIDER_OPTION.id}
                onClick={() => setSelectedProvider(ANY_PROVIDER_OPTION)}
                className={`p-4 border rounded-lg text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 cursor-pointer
                  ${selectedProvider?.id === ANY_PROVIDER_OPTION.id
                    ? "bg-blue-900 text-white ring-2 ring-blue-900 ring-offset-2"
                    : "bg-white hover:border-blue-800 hover:bg-blue-50"}
                `}
              >
                <div className="p-2 bg-slate-100 rounded-full text-slate-700"><Icon icon="lucide:users" width="32" height="32" /></div>
                <p className="font-semibold text-lg">{ANY_PROVIDER_OPTION.name}</p>
                <p className="text-sm text-slate-500 -mt-1">First available</p>
              </button>
              {service.providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider)}
                  disabled={!provider.isActive}
                  className={`p-4 border rounded-lg text-center transition-all duration-200 flex flex-col items-center gap-3
                    ${selectedProvider?.id === provider.id
                      ? "bg-blue-900 text-white ring-2 ring-blue-900 ring-offset-2"
                      : "bg-white hover:border-blue-800 hover:bg-blue-50"}
                    ${!provider.isActive ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="p-2 bg-slate-100 rounded-full text-slate-700"><Icon icon="lucide:user" width="32" height="32" /></div>
                  <p className="font-semibold text-lg">{provider.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${provider.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                    {provider.isActive ? 'Available' : 'Unavailable'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- Call to Action (CTA) Button --- */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <button
            onClick={handleBooking}
            disabled={isLoading || !selectedProvider}
            className="w-full bg-blue-900 text-white font-bold text-lg py-4 rounded-lg
                       hover:bg-blue-800 transition-all
                       disabled:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            {/* --- CLEAN & TYPE-SAFE LOGIC --- */}
            {/* We check for the `isAny` flag on the selectedProvider object. */}
            {selectedProvider?.isAny
              ? 'Join Queue for Any Specialist'
              : `Continue with ${selectedProvider?.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// This wrapper component remains the same
const ServiceDetailPage = () => {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center text-slate-500">Loading Page...</div>}>
      <ServiceDetailContent />
    </Suspense>
  );
};

export default ServiceDetailPage;