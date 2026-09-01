// src/components/Herosection.tsx
import React from 'react';
import Filterherosection from './Filterherosection';

export default function Herosection() {
  return (
    <div
      className="relative bg-fixed bg-cover bg-center bg-no-repeat pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-slate-800/20 mt-0 rounded-t-none rounded-b-3xl overflow-hidden"
      style={{ backgroundImage: "url('/images/test1.jpg')" }}
    >
      {/* Dark gradient overlay for contrast, depth and readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/65 to-slate-950/80 backdrop-blur-[1px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Main Headline */}
        <div className="text-center mb-6 sm:mb-8 max-w-3xl mx-auto pt-2">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-3 drop-shadow-md">
            Find your next <span className="text-amber-400">luxury escape.</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-200 max-w-xl mx-auto drop-shadow-sm font-medium">
            Book top barbershops, hair salons, massage, nails & skincare near you with elase.
          </p>
        </div>

        {/* Search Bar + Mobile Full Screen Filter + Category Badges */}
        <Filterherosection />
      </div>
    </div>
  );
}