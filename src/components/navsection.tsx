"use client";

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
// --- THE FIX: Import the new Supabase function ---
import { searchServices } from '@/lib/supabase-utils';
import type { Service } from '@/type';
import { Icon } from '@iconify/react';

interface NavSectionProps {
  servicesSectionId: string;
}

const NavSection = ({ servicesSectionId }: NavSectionProps) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-tertiary shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Link href="/" passHref>
            <div className='flex items-center gap-2'>
              <img src="/images/logopro.svg" alt="Company Logo" className='h-8 w-auto' />
              <span className="text-2xl font-bold text-white cursor-pointer">GizeBook</span>
            </div>
          </Link>
        </div>

        {/* Middle: Search Box (Hidden on mobile) */}
        <div className="hidden md:block flex-1 max-w-md mx-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon icon="material-symbols-light:search-rounded" width="24" height="24" />
            </div>
            <SearchBox />
          </div>
        </div>

        {/* Right: Book Now button + Mobile Search Icon */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Icon */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-gray-100 text-white"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Icon icon="material-symbols-light:search-rounded" width="24" height="24" />
          </button>

          {/* Book Now */}
          <Link href={'https://dashbordqms-is4ip2rwo-kidusyaas-projects.vercel.app/registration/company' } target='_black'>
            <button className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200">
              Register Services
            </button>
          </Link>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="absolute top-0 left-0 w-full h-full bg-white z-50 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">Search</span>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Icon icon="material-symbols:close-rounded" width="24" height="24" />
            </button>
          </div>
          <SearchBox autoFocus closeSearch={() => setMobileSearchOpen(false)} />
        </div>
      )}
    </nav>
  );
};
export default NavSection;

const SearchBox = ({ autoFocus = false, closeSearch }: { autoFocus?: boolean, closeSearch?: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Service[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        // This now calls our new, fast Supabase function!
        const r = await searchServices(trimmed);
        setResults(r); // The API already limits the results
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce to avoid too many API calls
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="relative" ref={containerRef}>
      
      <input
        autoFocus={autoFocus}
        id="global-search"
        name="global-search"
        className="block w-full rounded-full border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:text-sm"
        placeholder="Search services, companies, or codes"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
      />

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {loading && <div className="p-3 text-sm text-gray-500">Searching...</div>}
          {!loading && results.map((svc) => (
            // --- THE FIX: Use snake_case `company_id` to match Supabase data ---
            <Link
              href={`/services/${svc.id}?companyId=${svc.company_id}`}
              key={`${svc.company_id}-${svc.id}`} // Also update the key
              className="block px-3 py-2 hover:bg-gray-50"
              onClick={() => {
                setOpen(false);
                closeSearch?.();
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{svc.name}</div>
                  {/* The company object is now nested, which is great */}
                  <div className="text-xs text-gray-500 truncate">{svc.company?.name || 'Unknown company'}</div>
                </div>
                <div className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{svc.code}</div>
              </div>
            </Link>
          ))}
          {!loading && results.length === 0 && <div className="p-3 text-sm text-gray-500">No matches</div>}
        </div>
      )}
    </div>
  );
};