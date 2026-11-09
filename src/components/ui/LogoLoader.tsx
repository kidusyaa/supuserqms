'use client';

import React from 'react';
import Image from 'next/image';

export type LoaderVariant = 'spinner' | 'pulse' | 'shimmer' | 'flip';
export type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoLoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize | number;
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeMap: Record<LoaderSize, number> = {
  sm: 44,
  md: 68,
  lg: 96,
  xl: 130,
};

const gifVariantMap: Record<LoaderVariant, string> = {
  spinner: '/images/logo-spinner.gif',
  pulse: '/images/logo-pulse.gif',
  shimmer: '/images/logo-shimmer.gif',
  flip: '/images/logo-flip.gif',
};

export function LogoLoader({
  variant = 'flip',
  size = 'md',
  text,
  subtext,
  fullScreen = false,
  className = '',
}: LogoLoaderProps) {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  const gifSrc = gifVariantMap[variant] || '/images/logo-flip.gif';

  const content = (
    <div className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className="relative flex items-center justify-center select-none"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Image
          src={gifSrc}
          alt="Loading..."
          width={pixelSize}
          height={pixelSize}
          unoptimized
          priority
          className="object-contain drop-shadow-[0_4px_16px_rgba(247,147,30,0.25)]"
        />
      </div>

      {text && (
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-semibold tracking-wide text-neutral-800 dark:text-neutral-100 flex items-center">
            {text}
            <span className="inline-flex w-4 text-left animate-pulse">...</span>
          </p>
          {subtext && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-[220px]">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-neutral-950/85 backdrop-blur-md transition-all">
        <div className="p-8 rounded-2xl bg-white/70 dark:bg-neutral-900/80 shadow-2xl border border-orange-500/10">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

export default LogoLoader;
