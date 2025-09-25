// components/company-componets/ServiceCard.tsx
import Image from "next/image";
import Link from "next/link";
import {
  CardDescription,
  CardTitle,
} from "@/components/ui/card"; // Adjusted imports, Card, CardContent, etc. are not directly used in JSX
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Tag } from "lucide-react";

// Assuming your Service type is defined in "@/type"
import { Service } from "@/type";

interface ServiceCardProps {
  service: Service;
}

// --- Helper functions for discount logic ---
const calculateDiscountedPrice = (service: Service): string | null => {
  const originalPrice = parseFloat(service.price || '0');
  if (!service.discount_type || service.discount_value === null || originalPrice === 0) {
    return service.price; // Return original price if no valid discount type or value
  }
  let finalPrice = originalPrice;
  if (service.discount_type === 'percentage') {
    finalPrice = originalPrice * (1 - service.discount_value / 100);
  } else if (service.discount_type === 'fixed') {
    finalPrice = originalPrice - service.discount_value;
  }
  return (finalPrice > 0 ? finalPrice : 0).toFixed(2);
};

const formatDiscount = (service: Service): string => {
  if (!service.discount_type || service.discount_value === null) return "";
  if (service.discount_type === 'percentage') {
    return `${service.discount_value}% OFF`;
  }
  if (service.discount_type === 'fixed') {
    return `Save $${service.discount_value}`; // More user-friendly for fixed
  }
  return "";
};
// --- End of Helper functions ---


export default function ServiceCard({ service }: ServiceCardProps) {
  const isAvailable = service.status === 'active';

  // --- Discount calculations for the card ---
  // Ensure we have both type and value and a valid original price
  const hasDiscount = service.discount_type && service.discount_value !== null && parseFloat(service.price || '0') > 0;
  
  const originalPriceValue = parseFloat(service.price || '0');
  const formattedOriginalPrice = originalPriceValue > 0 ? `$${originalPriceValue.toFixed(2)}` : null;
  
  const discountedPriceValue = hasDiscount ? parseFloat(calculateDiscountedPrice(service) || '0') : originalPriceValue;
  const formattedDiscountedPrice = discountedPriceValue > 0 ? `$${discountedPriceValue.toFixed(2)}` : null;

  const discountLabel = hasDiscount ? formatDiscount(service) : null;
  // --- End of Discount calculations ---


  return (
    <div className="bg-gray-50 border text-tertiary rounded-lg overflow-hidden transition-all duration-300 hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-900/20 group ">
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={service.photo || "/placeholder-service.png"}
          alt={service.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Discount Badge - Top Left (e.g., "20% OFF" or "Save $10") */}
        {hasDiscount && discountLabel && (
          <Badge className="absolute top-3 left-3 bg-red-600/80 backdrop-blur-sm border border-red-400 text-white text-sm py-1 px-3 flex items-center gap-1 z-10">
            <Tag className="h-3 w-3" /> {discountLabel}
          </Badge>
        )}

        {/* Service Category Badge - Top Right */}
        {service.service_category?.name && (
          <Badge className="absolute top-3 right-3 bg-blue-600/80 backdrop-blur-sm border border-blue-400 text-white text-sm py-1 px-3 z-10">
            {service.service_category.name}
          </Badge>
        )}
      </div>

      <div className="p-4 flex flex-col space-y-4"> {/* Reduced space-y for tighter content */}
        {/* Service Name and Price */}
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold ">{service.name}</CardTitle>
          
          {/* Price Display */}
         
          {formattedOriginalPrice && (
            <div className="flex items-baseline mt-1 gap-2"> {/* Added gap-2 for spacing between prices */}
              {hasDiscount && (
                <span className="line-through text-sm text-slate-500">{formattedOriginalPrice}</span>
              )}
              <span className="text-xl font-semibold text-tertiary">{formattedDiscountedPrice}</span>
            </div>
          )}
          
        </div>

        {/* Service Description */}
        {service.description && (
          <CardDescription className="line-clamp-2 text-slate-400">{service.description}</CardDescription>
        )}

        {/* Wait Time and Availability */}
        <div className="flex items-center justify-between text-sm mt-auto"> {/* mt-auto pushes this and button to bottom */}
          {service.estimated_wait_time_mins != null && service.estimated_wait_time_mins > 0 && (
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>~{service.estimated_wait_time_mins} mins</span>
            </div>
          )}
          <Badge variant="outline" className={isAvailable ? "border-green-500/50 bg-green-700 text-white" : "border-slate-600 bg-slate-700 text-slate-400"}>
              {isAvailable ? "Available" : "Not Available"}
          </Badge>
        </div>
        
        {/* Book Now Button */}
        <div className="mt-4"> {/* Added mt-4 for consistent spacing before button */}
          <Button 
            asChild 
            className="w-full bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
            disabled={!isAvailable}
          >
            <Link href={`/booking/${service.id}`}>
              <Zap className="mr-2 h-4 w-4" />
              {isAvailable ? 'Book Now' : 'Currently Unavailable'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}