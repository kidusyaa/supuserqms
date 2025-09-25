"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Phone, Users, Tag } from "lucide-react"; // Added Tag icon for discount badge
import type { Service, Company } from "@/type";
import { format, isToday } from "date-fns";

interface ServiceDetailsCardProps {
  service: Service;
  company: Company;
  queueCount: number;
  estimatedQueueStartTime: Date | null;
}

// --- Helper functions for discount logic (copied from ServiceCard.tsx) ---
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
    return `Save $${service.discount_value}`;
  }
  return "";
};
// --- End of Helper functions ---


export default function ServiceDetailsCard({
  service,
  company,
  queueCount,
  estimatedQueueStartTime,
}: ServiceDetailsCardProps) {

  // --- Discount calculations for the card ---
  const hasDiscount = service.discount_type && service.discount_value !== null && parseFloat(service.price || '0') > 0;
  
  const originalPriceValue = parseFloat(service.price || '0');
  const formattedOriginalPrice = originalPriceValue > 0 ? `$${originalPriceValue.toFixed(2)}` : null;
  
  const discountedPriceValue = hasDiscount ? parseFloat(calculateDiscountedPrice(service) || '0') : originalPriceValue;
  const formattedDiscountedPrice = discountedPriceValue > 0 ? `$${discountedPriceValue.toFixed(2)}` : null;

  const discountLabel = hasDiscount ? formatDiscount(service) : null;
  // --- End of Discount calculations ---

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 ">
          <div className="flex-shrink-0 relative"> {/* Added relative for absolute positioning of badges */}
            <Image
              src={service.photo || "/placeholder-service.png"}
              alt={service.name}
              width={300}
              height={200}
              className="rounded-lg object-cover aspect-[3/2]"
            />
             {/* Discount Badge - Top Left */}
            {hasDiscount && discountLabel && (
              <Badge className="absolute top-3 left-3 bg-red-600/80 backdrop-blur-sm border border-red-400 text-white text-sm py-1 px-3 flex items-center gap-1 z-10">
                <Tag className="h-3 w-3" /> {discountLabel}
              </Badge>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{service.name}</h1>
                <p className="text-muted-foreground mb-4">{service.description}</p>
              </div>
              
              {/* Updated Price Badge to show discount */}
              {formattedOriginalPrice && (
                <Badge variant="secondary" className="text-lg px-3 py-1 flex items-baseline gap-2">
                  {hasDiscount && <span className="line-through text-base text-gray-400">{formattedOriginalPrice}</span>}
                  <span className={`${hasDiscount ? 'font-bold' : ''}`}>{formattedDiscountedPrice}</span>
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Base time: {service.estimated_wait_time_mins} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Current queue: {queueCount} people</span>
              </div>
              {estimatedQueueStartTime ? (
                <div className="flex items-center gap-2 text-orange-600 col-span-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Est. Queue Start: {format(estimatedQueueStartTime, "h:mm a")}{" "}
                    {isToday(estimatedQueueStartTime) ? "Today" : format(estimatedQueueStartTime, "MMM do")}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500 col-span-2">
                  <Clock className="h-4 w-4" />
                  <span>Est. Queue Start: Unavailable</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{company.name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{company.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Code: {service.code}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}