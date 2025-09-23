"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useState } from 'react';

interface SubNavItem {
  name: string;
  href: string;
  icon: string;
  description: string;
}

const SubNavBar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigationItems: SubNavItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: 'material-symbols:home-outline',
      description: 'Go to homepage'
    },
    {
      name: 'Services',
      href: '/services',
      icon: 'material-symbols:room-service-outline',
      description: 'Browse all services'
    },
    {
      name: 'Companies',
      href: '/company',
      icon: 'material-symbols:business-outline',
      description: 'View companies'
    },
    {
      name: 'Categories',
      href: '/usercategory',
      icon: 'material-symbols:category-outline',
      description: 'Browse by category'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-16 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center space-x-1 py-3">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 min-w-[80px]
                ${isActive(item.href) 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              title={item.description}
            >
              <Icon 
                icon={item.icon} 
                width="24" 
                height="24" 
                className={`
                  mb-1 transition-colors duration-200
                  ${isActive(item.href) ? 'text-amber-600' : 'text-gray-500'}
                `}
              />
              <span className="text-xs font-medium text-center leading-tight">
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-3">
          {/* Mobile Menu Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center w-full py-2 px-4 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <Icon 
                icon="material-symbols:menu" 
                width="20" 
                height="20" 
                className="mr-2"
              />
              <span className="font-medium">Navigation Menu</span>
              <Icon 
                icon={isMobileMenuOpen ? "material-symbols:keyboard-arrow-up" : "material-symbols:keyboard-arrow-down"} 
                width="20" 
                height="20" 
                className="ml-2"
              />
            </button>
          </div>

          {/* Mobile Menu Items */}
          {isMobileMenuOpen && (
            <div className="mt-3 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive(item.href) 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon 
                    icon={item.icon} 
                    width="20" 
                    height="20" 
                    className={`
                      mr-3 transition-colors duration-200
                      ${isActive(item.href) ? 'text-amber-600' : 'text-gray-500'}
                    `}
                  />
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  {isActive(item.href) && (
                    <Icon 
                      icon="material-symbols:check-circle" 
                      width="16" 
                      height="16" 
                      className="text-amber-600"
                    />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default SubNavBar;
