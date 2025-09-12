// src/components/Herosection.tsx
import React from 'react';
import HomeFilterSection from './filterherosection';

export default function Herosection() {
  return (
    <section className="relative flex flex-col justify-start">
      {/* Hero background */}
      <div className="bg-tertiary md:rounded-b-[200px] rounded-b-2xl">
        <div className="container mx-auto px-4 pt-8 pb-12 md:pb-40 lg:pb-48 ">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white md:mb-6 mb-4 leading-tight">
              Find & Book Trusted Services
              <span className="text-amber-500 block">Effortlessly</span>
            </h1>
            <p className="text-lg text-slate-200 max-w-3xl mx-auto">
              From home repairs to personal wellness, connect with top-rated professionals in your area.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="container mx-auto -mt-16 md:-mt-20 lg:-mt-36 px-6 z-10 ">
        <HomeFilterSection />
      </div>
    </section>
  );
}
