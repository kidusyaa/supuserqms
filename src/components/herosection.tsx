// src/components/Herosection.tsx
import React from 'react';
import Filterherosection from './Filterherosection';
import CompanyTypesPage from './company-types';

export default function Herosection() {
  
  return (
    <div 
      className="relative flex flex-col justify-start overflow-hidden"
    >
      {/* Background container with a rich dark gradient and bottom rounding */}
      <div className="relative bg-gradient-to-br from-tertiary via-slate-900 to-tertiary pb-16 pt-12 md:pb-24 md:pt-20 md:rounded-b-[80px] rounded-b-3xl shadow-2xl">
        
        {/* Subtle Background Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('/images/patten-1.svg')] bg-cover bg-center opacity-10 pointer-events-none" />
        
        {/* Radial Glow Highlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-none text-balance">
              Find & Book Trusted Services
              <span className="text-primary block mt-1 md:mt-2 bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                Effortlessly
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
              Discover top-rated barbershops, beauty salons, and massage therapists in your neighborhood. Compare wait times and book instantly.
            </p>
          </div>
          
          <Filterherosection />
        </div>
        
      </div>
      
    </div>
  );
}