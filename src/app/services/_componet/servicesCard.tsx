// src/components/ServiceCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // For optimized image loading
import { Service } from '@/type'; // Assuming Service type is in type.ts
import { Button } from '@/components/ui/button'; // Assuming Shadcn Button
import { LayoutGrid, Loader2 } from 'lucide-react'; // Placeholder icons
import { getCategories } from '@/lib/api';
interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  return (
    <Link href={`/booking/${service.id}`} className="block h-full">
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col items-center p-4 hover:shadow-md hover:-translate-y-1 transition-all h-full">
        {service.photo ? (
          <div className="w-full h-48 relative overflow-hidden rounded-md mb-4">
            <Image
              src={service.photo}
              alt={service.name}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
              unoptimized // If your images are from Supabase and not optimized by Next.js image loader
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground rounded-md mb-4">
            <LayoutGrid className="h-12 w-12" /> {/* Placeholder icon */}
          </div>
        )}
        <div className="flex-1 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">{service.name}</h3>
          {service.company && (
            <p className="text-sm text-muted-foreground">
              {service.company.name} {service.company.location_text && `(${service.company.location_text})`}
            </p>
          )}
          {service.category_id && (
            <p className="text-xs text-secondary-foreground mt-1">Category: {service.category_id}</p>
          )}
          {service.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{service.description}</p>
          )}
        </div>
        <Button variant="outline" className="text-sm mt-auto w-full">View Details</Button>
      </div>
    </Link>
  );
};

export default ServiceCard;