"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CompanyPhoto } from '@/type';
import { cn } from '@/lib/utils';

interface CompanyPhotosGalleryProps {
  photos: CompanyPhoto[];
}

export default function CompanyPhotosGallery({ photos }: CompanyPhotosGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Automatic Slider logic - only active if there are 3+ photos for the main slot
  useEffect(() => {
    if (photos.length <= 2) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [photos.length]);

  if (!photos || photos.length === 0) return null;

  const photoCount = photos.length;

  /** 
   * CASE 1: Single Photo 
   * Displays as a beautiful, high-impact hero banner
   */
  if (photoCount === 1) {
    return (
      <div className="relative h-[300px] md:h-[500px] w-full overflow-hidden rounded-3xl group shadow-md">
        <Image
          src={photos[0].url}
          alt="Company Venue"
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    );
  }

  /** 
   * CASE 2: Two Photos
   * Displays as a modern split-screen layout
   */
  if (photoCount === 2) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px] md:h-[500px] w-full">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative h-full w-full overflow-hidden rounded-3xl group shadow-sm">
            <Image
              src={photo.url}
              alt={`Venue ${index + 1}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        ))}
      </div>
    );
  }

  /** 
   * CASE 3: Three or More Photos
   * Displays the Mosaic layout: 1 Large Slider + 2 Smaller static images
   */
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[450px] md:h-[550px] w-full overflow-hidden rounded-3xl">
      
      {/* LEFT: Main Featured Slider (occupies 2/3 of desktop width) */}
      <div className="md:col-span-2 relative h-full w-full overflow-hidden bg-slate-100 rounded-2xl md:rounded-l-3xl">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={cn(
              "absolute inset-0 transition-all duration-1000 ease-in-out",
              index === activeIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
            )}
          >
            <Image
              src={photo.url}
              alt={`Featured Gallery ${index}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}

        {/* Floating Slide Indicators (Dots) */}
        <div className="absolute bottom-6 left-6 flex gap-2 z-10">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                i === activeIndex ? "w-8 bg-amber-500" : "w-2 bg-white/60 hover:bg-white"
              )}
            />
          ))}
        </div>
      </div>

      {/* RIGHT: Static Side Stack (only visible on desktop/tablet) */}
      <div className="hidden md:flex flex-col gap-3 h-full">
        {/* Top Right Photo */}
        <div className="relative flex-1 overflow-hidden group rounded-tr-3xl shadow-sm">
          <Image 
            src={photos[1].url} 
            alt="Venue detail" 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
        </div>
        
        {/* Bottom Right Photo */}
        <div className="relative flex-1 overflow-hidden group rounded-br-3xl shadow-sm">
          <Image 
            src={photos[2].url} 
            alt="Interior view" 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-110" 
          />
          
          {/* If there are more than 3 photos, show a "+X more" overlay on the last tile */}
          {photoCount > 3 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] group-hover:bg-black/20 transition-all">
              <p className="text-white font-bold text-xl drop-shadow-md">
                +{photoCount - 3} Photos
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
        </div>
      </div>
    </div>
  );
}