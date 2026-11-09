import React from 'react';
import { LogoLoader } from '@/components/ui/LogoLoader';

export default function Loading() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-6">
      <LogoLoader
        variant="flip"
        size="lg"
        text="Loading"
        subtext="Getting things ready for you"
      />
    </div>
  );
}
