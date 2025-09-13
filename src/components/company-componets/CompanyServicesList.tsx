// components/company-componets/CompanyServicesList.tsx
import { Service } from "@/type"
import ServiceCard from "./ServiceCard"

interface CompanyServicesListProps {
  services: Service[] | undefined;
}

export default function CompanyServicesList({ services }: CompanyServicesListProps) {
  return (
    // ✨ The top margin is removed as it's handled by the main page layout now.
    <div>
      <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-amber-500 pl-4">
        Our Services
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services && services.length > 0 ? (
          services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-slate-400">No services are currently available.</p>
          </div>
        )}
      </div>
    </div>
  )
}