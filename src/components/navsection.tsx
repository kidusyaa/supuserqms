"use client";

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
// --- THE FIX: Import the new Supabase function ---
import { searchServices } from '@/lib/supabase-utils';
import type { Service } from '@/type';
import { Icon } from '@iconify/react';
import { UserMenu } from './Usermenu';

interface NavSectionProps {
  servicesSectionId: string;
}

const NavSection = ({ servicesSectionId }: NavSectionProps) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-xs">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Left: Search Box (Desktop) */}
        <div className="hidden md:block w-48 sm:w-64 lg:w-72">
          <SearchBox />
        </div>

        {/* Mobile Search Toggle Icon on Left for mobile layout */}
        <div className="md:hidden flex items-center">
          <button
            className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search"
          >
            <Icon icon="material-symbols-light:search-rounded" width="24" height="24" />
          </button>
        </div>

        {/* Middle: Logo & GizeBook text with Tertiary background */}
        <div className="flex-shrink-0 flex justify-center">
          <Link href="/" passHref>
            <div className="flex items-center gap-2 bg-tertiary px-4 py-1.5 rounded-full text-white shadow-xs hover:opacity-90 transition-all cursor-pointer">
              <img src="/images/logopro.png" alt="GizeBook Logo" className="h-7 w-auto object-contain" />
              <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight">GizeBook</span>
            </div>
          </Link>
        </div>

        {/* Right: Round buttons with white background & orange border line */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Menu / Sign In */}
          <div className="hidden sm:block">
            <UserMenu />
          </div>

          {/* Register Services Button */}
          <Link href={'https://app.gizebook.com/registration/company'} target='_blank'>
            <button className="rounded-full bg-white border-2 border-amber-500 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-amber-600 shadow-xs hover:bg-amber-50 transition-all">
              Register Services
            </button>
          </Link>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="absolute top-0 left-0 w-full h-full bg-white z-50 p-4 flex flex-col shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-slate-800">Search Services</span>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 text-slate-700"
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
              href={`/booking/${svc.id}?companyId=${svc.company_id}`}
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