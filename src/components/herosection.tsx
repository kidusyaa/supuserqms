// src/components/Herosection.tsx
import React from 'react';
import Filterherosection from './Filterherosection';

export default function Herosection() {
  return (
    <div className="relative bg-white pt-4 pb-10 sm:pt-6 sm:pb-12 border-b border-slate-100 mt-0 rounded-t-none rounded-b-2xl">
      <div className="container mx-auto px-4">
        {/* Main Headline matching sample image */}
        <div className="text-center mb-6 sm:mb-8 max-w-3xl mx-auto pt-2">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            Find your next <span className="text-amber-500">luxury escape.</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-500 max-w-xl mx-auto">
            Book top barbershops, hair salons, massage, nails & skincare near you with ease.
          </p>
        </div>

        {/* Search Bar + Mobile Full Screen Filter + Category Badges */}
        <Filterherosection />
      </div>
    </div>
  );
}