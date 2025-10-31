import Image from "next/image";
import Link from "next/link";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Tag } from "lucide-react";
import { Service } from "@/type";

interface ServiceCardProps {
  service: Service;
}

// Helper functions (no changes needed here)
const calculateDiscountedPrice = (service: Service): string | null => {
  const originalPrice = parseFloat(service.price || '0');
  if (!service.discount_type || service.discount_value === null || originalPrice === 0) {
    return service.price;
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

export default function CompanyServiceCard({ service }: ServiceCardProps) {
  const isAvailable = service.status === 'active';

  // Resolve primary photo from service.photo or first service_photos url
  const primaryPhoto = (service.photo && service.photo.trim().length > 0)
    ? service.photo
    : service.service_photos?.[0]?.url || null;

  const isRemotePhoto = !!primaryPhoto && (
    primaryPhoto.startsWith("http://") ||
    primaryPhoto.startsWith("https://")
  );

  const photoSrc = isRemotePhoto ? primaryPhoto : "/placeholder.svg";

  // Discount calculations (no changes needed)
  const hasDiscount = service.discount_type && service.discount_value !== null && parseFloat(service.price || '0') > 0;
  const originalPriceValue = parseFloat(service.price || '0');
  const formattedOriginalPrice = originalPriceValue > 0 ? `$${originalPriceValue.toFixed(2)}` : null;
  const discountedPriceValue = hasDiscount ? parseFloat(calculateDiscountedPrice(service) || '0') : originalPriceValue;
  const formattedDiscountedPrice = discountedPriceValue > 0 ? `$${discountedPriceValue.toFixed(2)}` : null;
  const discountLabel = hasDiscount ? formatDiscount(service) : null;

  return (
    <div className="bg-card border text-card-foreground rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg group flex flex-col h-full">
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={photoSrc}
          alt={service.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {hasDiscount && discountLabel && (
          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground z-10">
            <Tag className="h-3 w-3 mr-1" /> {discountLabel}
          </Badge>
        )}

        {service.service_category?.name && (
          <Badge className="absolute top-3 right-3 bg-primary/80 backdrop-blur-sm text-primary-foreground z-10">
            {service.service_category.name}
          </Badge>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-grow space-y-3">
        {/* ... the rest of your component remains the same ... */}
        <div className="flex flex-row items-start justify-between">
          <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{service.name}</CardTitle>
          
          {formattedOriginalPrice && (
            <div className="flex flex-col items-end flex-shrink-0 ml-2">
              <span className="text-xl font-semibold text-foreground">{formattedDiscountedPrice}</span>
              {hasDiscount && (
                <span className="line-through text-sm text-muted-foreground -mt-1">{formattedOriginalPrice}</span>
              )}
            </div>
          )}
        </div>

        {service.description && (
          <CardDescription className="line-clamp-2 text-muted-foreground">{service.description}</CardDescription>
        )}

        <div className="mt-auto space-y-4 pt-2">
            <div className="flex items-center justify-between text-sm">
                {service.estimated_wait_time_mins != null && service.estimated_wait_time_mins > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>~{service.estimated_wait_time_mins} mins</span>
                    </div>
                )}
                <Badge variant={isAvailable ? "default" : "secondary"} className={isAvailable ? "bg-green-600/20 text-green-500 border-green-600/30" : ""}>
                    {isAvailable ? "Available" : "Not Available"}
                </Badge>
            </div>
            
            <Button 
                asChild 
                className="w-full"
                variant="default"
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
  );
}