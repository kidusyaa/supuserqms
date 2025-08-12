// src/components/NavSection.tsx

"use client"; // This must be a client component to handle the onClick scroll event.

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { searchServices } from '@/lib/firebase-utils';
import type { Service } from '@/type';

// Define the props the component will accept.
// This makes it reusable: you can tell it which section to scroll to.
interface NavSectionProps {
  servicesSectionId: string;
}

const NavSection = ({ servicesSectionId }: NavSectionProps) => {
  
  // This function handles the smooth scrolling.
  const handleScrollToServices = () => {
    const servicesSection = document.getElementById(servicesSectionId);
    if (servicesSection) {
      servicesSection.scrollIntoView({
        behavior: 'smooth', // This creates the smooth scroll animation
        block: 'start',
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Logo */}
        <div className="flex-shrink-0">
          <Link href="/" passHref>
            <div className='flex items-center gap-2'>
                <img src="/images/logopro.svg" alt="Company Logo" className='h-8 w-auto' />
                <span className="text-2xl font-bold text-gray-800 cursor-pointer">
              GizeBook
            </span>
            </div>
            {/* If you have an image logo, use this instead: */}
            {/* <img className="h-8 w-auto" src="/logo.png" alt="Company Logo" /> */}
          </Link>
        </div>

        {/* Middle: Optional Search Bar (Hidden on mobile, appears on larger screens) */}
        <div className="hidden md:block flex-1 max-w-md mx-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {/* Search Icon SVG */}
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </div>
            <SearchBox />
          </div>
        </div>

        {/* Right Side: "Book Now" Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleScrollToServices}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200"
          >
            Book Now
          </button>
        </div>

      </div>
    </nav>
  );
};

export default NavSection;

// Internal search component with debounce and dropdown results
const SearchBox = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Service[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const r = await searchServices(trimmed);
        setResults(r.slice(0, 8));
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        id="global-search"
        name="global-search"
        className="block w-full rounded-full border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        placeholder="Search services, companies, or codes (e.g., hair, HC001)"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
      />

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {loading && (
            <div className="p-3 text-sm text-gray-500">Searching...</div>
          )}
          {!loading && results.map((svc) => (
            <Link
              href={`/services/${svc.id}?companyId=${svc.companyId}`}
              key={`${svc.companyId}-${svc.id}`}
              className="block px-3 py-2 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{svc.name}</div>
                  <div className="text-xs text-gray-500 truncate">{svc.company?.name || 'Unknown company'}</div>
                </div>
                <div className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{svc.code}</div>
              </div>
            </Link>
          ))}
          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-gray-500">No matches</div>
          )}
        </div>
      )}
    </div>
  );
};