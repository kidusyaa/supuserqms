// src/components/Herosection.tsx
import React from 'react';
import Filterherosection from './Filterherosection';
import CompanyTypesPage from './company-types';

export default function Herosection() {
  
  return (
    <div 
      // --- UPDATED: Adjusted padding-bottom for responsiveness ---
      // On small screens, ensure enough space for the stacked filter section
      // On medium/large screens, the filter section is shorter horizontally, so less padding is needed.
      className="relative pb-[100px] md:pb-[180px] lg:pb-[200px] flex flex-col justify-start "
    >
      {/* This div controls the background color and shape */}
      <div className='bg-tertiary h-[400px] lg:h-[500px] md:rounded-b-[200px] rounded-b-md'>
        <div className='container mx-auto px-4 pt-10'>
          <div className="text-center mb-12">
            {/* These text colors are already white and amber-500 */}
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
      
      {/* The Filterherosection is absolutely positioned over the bottom of the hero background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10 ">
      <div className=''>
      <CompanyTypesPage/>
      </div>
        <Filterherosection/>
      </div>
    </div>
  );
}