// src/components/Herosection.tsx
import React from 'react';
import Filterherosection from './Filterherosection';

export default function Herosection() {
  
  return (
    <div 
      // --- UPDATED: Adjusted padding-bottom for responsiveness ---
      // On small screens, ensure enough space for the stacked filter section
      // On medium/large screens, the filter section is shorter horizontally, so less padding is needed.
      className="relative pb-[100px] md:pb-[180px] lg:pb-[200px] flex flex-col justify-start "
    >
      <div className='bg-tertiary h-[300px] lg:h-[400px] md:rounded-b-[200px] rounded-b-lg'> {/* Corrected rounded-b-4xl to rounded-b-2xl assuming it was a typo for common tailwind sizes */}
        <div className='container mx-auto px-4 pt-10'>
          <div className="text-center mb-12">
            <h1 className="text-2xl md:text-6xl font-extrabold text-white mb-6 text-balance leading-tight">
              Find & Book Trusted Services
              <span className="text-amber-500 block">Effortlessly</span>
            </h1>
            <p className=" md:block hidden text-lg text-slate-400 max-w-3xl mx-auto">
              From home repairs to personal wellness, connect with top-rated professionals in your area.
            </p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10 ">
        <Filterherosection/>
      </div>
    </div>
  );
}