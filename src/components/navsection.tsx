"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { UserMenu } from './Usermenu';

interface NavSectionProps {
  servicesSectionId?: string;
}

const NavSection = ({ servicesSectionId }: NavSectionProps) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Explore', href: '/services' },
    { name: 'Bookings', href: '/profile' },
    { name: 'Companies', href: '/company' },
  ];

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all">
      <div className="container mx-auto flex h-16 sm:h-[70px] items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* ── Left: Brand Logo & Unified Tertiary Title ── */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/images/logopro.png"
              alt="GizeBook Logo"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-tertiary">
              GizeBook
            </span>
          </Link>
        </div>

        {/* ── Center: Desktop Navigation Links (Styled matching reference) ── */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative py-1 text-[15px] lg:text-base font-semibold tracking-normal transition-colors ${
                  active
                    ? 'text-tertiary font-bold'
                    : 'text-tertiary/75 hover:text-tertiary'
                }`}
              >
                {link.name}
                {active && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-tertiary rounded-full animate-in fade-in duration-200" />
                )}
              </Link>
            );
          })}

          {/* Unique "For business" Button */}
          <Link
            href="/for-business"
            className={`group relative inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-full transition-all hover:scale-[1.03] active:scale-[0.98] border ml-2 ${
              pathname === '/for-business'
                ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                : 'bg-gradient-to-r from-tertiary to-slate-800 text-white shadow-sm hover:shadow-md hover:from-slate-800 hover:to-tertiary border-slate-700/50'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="tracking-tight">For business</span>
            <Icon
              icon="solar:arrow-right-up-linear"
              className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </Link>
        </nav>

        {/* ── Right: Profile Section & Mobile Hamburger ── */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Lazy/User Profile Section */}
          <div className="flex items-center">
            <UserMenu />
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-tertiary hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              <Icon
                icon={mobileMenuOpen ? "solar:close-circle-bold" : "solar:hamburger-menu-linear"}
                width="26"
                height="26"
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Dropdown / Slide-down Menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-5 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-base font-semibold transition-colors ${
                    active
                      ? 'bg-slate-100 text-tertiary font-bold'
                      : 'text-tertiary/80 hover:bg-slate-50 hover:text-tertiary'
                  }`}
                >
                  <span>{link.name}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />}
                </Link>
              );
            })}
          </div>

          {/* Mobile "For business" Banner / Button */}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/for-business"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl text-white shadow-sm font-bold text-sm ${
                pathname === '/for-business'
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-tertiary to-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>For business / List salon</span>
              </div>
              <Icon icon="solar:arrow-right-up-linear" className="w-4 h-4 text-amber-400" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavSection;