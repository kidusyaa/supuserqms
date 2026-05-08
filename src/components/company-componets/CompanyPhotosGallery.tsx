// components/company-componets/CompanyPhotosGallery.tsx
"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CompanyPhoto } from '@/type';
import { Button } from '@/components/ui/button';

interface CompanyPhotosGalleryProps {
  photos: CompanyPhoto[];
}

export default function CompanyPhotosGallery({ photos }: CompanyPhotosGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Automatic Slider logic
  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [photos.length]);

  if (!photos || photos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[300px] md:h-[500px] w-full overflow-hidden rounded-2xl">
      {/* Main Slider (2/3 width on desktop) */}
      <div className="md:col-span-2 relative h-full w-full overflow-hidden">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={photo.url}
              alt={`Gallery ${index}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Side Stack (Hidden on small screens) */}
      <div className="hidden md:flex flex-col gap-3 h-full">
        <div className="relative flex-1 overflow-hidden">
          <Image 
            src={photos[1]?.url || photos[0].url} 
            alt="Interior 1" 
            fill 
            className="object-cover hover:scale-105 transition-transform duration-500" 
          />
        </div>
        <div className="relative flex-1 overflow-hidden">
          <Image 
            src={photos[2]?.url || photos[0].url} 
            alt="Interior 2" 
            fill 
            className="object-cover hover:scale-105 transition-transform duration-500" 
          />
          {/* Button only visible on Desktop */}
        
        </div>
      </div>
    </div>
  );
}