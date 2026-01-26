// src/components/book/ServiceDetailsCard.tsx - Updated with better UI
"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Phone, Users, Tag, CodeSquare, X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Service, Company } from "@/type";
import { format, isToday } from "date-fns";
import { useEffect, useState, useRef } from "react";

interface ServiceDetailsCardProps {
  service: Service;
  company: Company;
  queueCount: number;
  estimatedQueueStartTime: Date | null;
}

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

export default function ServiceDetailsCard({
  service,
  company,
  queueCount,
  estimatedQueueStartTime,
}: ServiceDetailsCardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);

  const hasDiscount = service.discount_type && service.discount_value !== null && parseFloat(service.price || '0') > 0;
  
  const originalPriceValue = parseFloat(service.price || '0');
  const formattedOriginalPrice = originalPriceValue > 0 ? `$${originalPriceValue.toFixed(2)}` : null;
  
  const discountedPriceValue = hasDiscount ? parseFloat(calculateDiscountedPrice(service) || '0') : originalPriceValue;
  const formattedDiscountedPrice = discountedPriceValue > 0 ? `$${discountedPriceValue.toFixed(2)}` : null;

  const discountLabel = hasDiscount ? formatDiscount(service) : null;

  // --- Image determination logic ---
  const imageUrls = new Set<string>();
  if (service.photo) imageUrls.add(service.photo);
  if (service.service_photos && service.service_photos.length > 0) {
    service.service_photos.forEach(p => {
      if (p.url) imageUrls.add(p.url);
    });
  }
  const uniqueImageUrls = Array.from(imageUrls);
  const hasImages = uniqueImageUrls.length > 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % uniqueImageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + uniqueImageUrls.length) % uniqueImageUrls.length);
  };

  // Auto-slide through images (pauses on hover or when fullscreen is open)
  useEffect(() => {
    if (uniqueImageUrls.length <= 1) return;
    if (isAutoPlayPaused) return;
    if (selectedImage) return;

    const id = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % uniqueImageUrls.length);
    }, 3500);

    return () => window.clearInterval(id);
  }, [uniqueImageUrls.length, isAutoPlayPaused, selectedImage]);

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailRef.current) {
      const scrollAmount = 200;
      thumbnailRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Card className="mb-8 overflow-hidden border-none shadow-lg bg-gradient-to-br from-white to-gray-50/50">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Images */}
          <div className="lg:w-2/5">
            <div className="relative">
              {/* Main Image with Carousel Controls */}
              <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <div className="relative">
                  <DialogTrigger asChild>
                    <div
                      className="relative cursor-pointer group"
                      onMouseEnter={() => setIsAutoPlayPaused(true)}
                      onMouseLeave={() => setIsAutoPlayPaused(false)}
                      onClick={() => {
                        const url = uniqueImageUrls[currentImageIndex];
                        if (url) setSelectedImage(url);
                      }}
                    >
                      <div className="relative h-64 sm:h-80 md:h-96 lg:h-[480px] w-full overflow-hidden rounded-lg">
                        <Image
                          src={uniqueImageUrls[currentImageIndex] || "/placeholder-service.png"}
                          alt={service.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      
                      {/* Discount Badge */}
                      {hasDiscount && discountLabel && (
                        <Badge className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm py-2 px-4 rounded-full shadow-lg border-0">
                          <Tag className="h-3 w-3 mr-1" /> {discountLabel}
                        </Badge>
                      )}

                      {/* Image Counter */}
                      {uniqueImageUrls.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white text-sm py-1 px-3 rounded-full">
                          {currentImageIndex + 1} / {uniqueImageUrls.length}
                        </div>
                      )}

                      {/* Carousel Controls */}
                      {uniqueImageUrls.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage();
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </DialogTrigger>

                  {/* Fullscreen Image View */}
                  <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-black/95 border-none">
                    <div className="relative w-full h-full">
                      <button 
                        onClick={() => setSelectedImage(null)} 
                        className="absolute top-4 right-4 text-white z-50 bg-black/50 hover:bg-black/70 rounded-full p-2 transition backdrop-blur-sm"
                        aria-label="Close"
                      >
                        <X className="h-6 w-6" />
                      </button>
                      {selectedImage && (
                        <div className="relative w-full h-full flex items-center justify-center p-8">
                          <Image
                            src={selectedImage}
                            alt="Enlarged service image"
                            width={1200}
                            height={800}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </div>
              </Dialog>

              {/* Thumbnail Carousel */}
              {uniqueImageUrls.length > 1 && (
                <div className="mt-4 px-2">
                  <div className="relative">
                   
                    
                    <div 
                      ref={thumbnailRef}
                      className="flex gap-3 overflow-x-auto scrollbar-hide px-8 py-2"
                    >
                      {uniqueImageUrls.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            index === currentImageIndex 
                              ? 'border-primary scale-105 shadow-md ring-2 ring-primary/20' 
                              : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                          }`}
                        >
                          <Image
                            src={url}
                            alt={`Service image ${index + 1}`}
                            width={96}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>

                   
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Service Details */}
          <div className="lg:w-3/5 p-6 lg:p-8">
            {/* Service Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{service.name}</h1>
                  {/* <div className="flex items-center gap-2 text-gray-600">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{service.rating || "4.8"}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{service.category}</span>
                  </div> */}
                </div>
                
                {/* Price Display */}
                {formattedOriginalPrice && (
                  <div className="text-right">
                    {hasDiscount && (
                      <span className="line-through text-lg text-gray-400 block mb-1">
                        {formattedOriginalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {formattedDiscountedPrice}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 text-lg leading-relaxed">{service.description}</p>
            </div>

            {/* Service Details Grid */}
            <div className="space-y-6">
              {/* Queue Status Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-900">{service.estimated_wait_time_mins} min</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">In Queue</p>
                      <p className="font-semibold text-gray-900">{queueCount} people</p>
                    </div>
                  </div>

                  {estimatedQueueStartTime ? (
                    <div className="flex items-center gap-3 col-span-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Next Available</p>
                        <p className="font-semibold text-orange-600">
                          {format(estimatedQueueStartTime, "h:mm a")}{" "}
                          {isToday(estimatedQueueStartTime) ? "(Today)" : format(estimatedQueueStartTime, "MMM d")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 col-span-2">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Clock className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Availability</p>
                        <p className="font-semibold text-red-600">Unavailable</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Info Card */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">{company.location_text}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-medium text-gray-900">{company.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <CodeSquare className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Service Code</p>
                      <Badge variant="outline" className="font-mono font-bold">
                        {service.code}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Features (if any) */}
              {/* {service.features && service.features.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Service Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1.5">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}