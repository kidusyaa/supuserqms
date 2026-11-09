import React from 'react';
import { LogoLoader } from '@/components/ui/LogoLoader';

export default function BookingServiceLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
      <LogoLoader
        variant="flip"
        size="lg"
        text="Loading Service Details"
        subtext="Preparing schedule and service options"
      />
    </div>
  );
}
