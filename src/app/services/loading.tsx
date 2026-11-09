import React from 'react';
import { LogoLoader } from '@/components/ui/LogoLoader';

export default function ServicesLoading() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-6">
      <LogoLoader
        variant="flip"
        size="lg"
        text="Loading Services"
        subtext="Finding top beauty, barbershop, and spa options"
      />
    </div>
  );
}
