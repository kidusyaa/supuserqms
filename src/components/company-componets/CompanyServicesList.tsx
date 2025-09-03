// components/company-detail/CompanyServicesList.tsx
import { Service } from "@/type" // Assuming Service type is defined in "@/type"
import ServiceCard from "./ServiceCard" // Import the individual ServiceCard

interface CompanyServicesListProps {
  services: Service[] | undefined;
}

export default function CompanyServicesList({ services }: CompanyServicesListProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Our Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services && services.length > 0 ? (
          services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>No services available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}