// src/components/Footer.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import React from 'react';
import DivCenter from './divCenter'; // Assuming you use this for main content width

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Define your navigation links
  const footerLinks = [
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Blog", href: "/blog" },
        { name: "Partners", href: "/partners" },
      ],
    },
    {
      title: "Services",
      links: [
        { name: "All Services", href: "/services" },
        { name: "Popular Services", href: "/services?popular=true" },
        { name: "Pricing", href: "/pricing" },
        { name: "How It Works", href: "/how-it-works" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "FAQ", href: "/faq" },
        { name: "Contact Us", href: "/contact" },
        { name: "Help Center", href: "/help" },
        { name: "Privacy Policy", href: "/privacy" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400 py-8 md:py-12">
      <DivCenter> {/* Use DivCenter for consistent content width */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12 pb-8 md:pb-12 border-b border-gray-700">
            {/* Brand/Logo Section */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center space-x-2 text-white text-2xl font-bold mb-4">
                {/* Replace with your actual logo if you have one */}
                {/* <Image src="/path/to/your/logo.png" alt="GizeBook Logo" width={40} height={40} /> */}
                <span>GizeBook</span>
              </Link>
              <p className="text-sm leading-relaxed mb-4">
                Connecting you with trusted local service providers effortlessly.
                Quality services, exceptional convenience.
              </p>
              {/* Contact Information (always visible) */}
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  <span>123 Main St, Addis Ababa, Ethiopia</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={18} className="text-primary" />
                  <a href="mailto:info@gizebook.com" className="hover:text-white transition-colors">
                    info@gizebook.com
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={18} className="text-primary" />
                  <a href="tel:+251912345678" className="hover:text-white transition-colors">
                    +251 912 345 678
                  </a>
                </p>
              </div>
            </div>

            {/* Navigation Links - Mobile Accordion / Desktop Grid */}
            {/* <div className="col-span-1 md:col-span-2 lg:col-span-3">
            
              <Accordion type="single" collapsible className="w-full md:hidden">
                {footerLinks.map((section, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg font-semibold text-white hover:no-underline">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pt-2">
                        {section.links.map((link, linkIndex) => (
                          <li key={linkIndex}>
                            <Link href={link.href} className="hover:text-white transition-colors text-base">
                              {link.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

          
              <div className="hidden md:grid md:grid-cols-3 md:gap-8 lg:gap-12">
                {footerLinks.map((section, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {section.title}
                    </h3>
                    <ul className="space-y-3">
                      {section.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <Link href={link.href} className="hover:text-white transition-colors text-base">
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div> */}
          </div>

          {/* Bottom Section: Social Media & Copyright */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin size={24} />
              </a>
            </div>

            {/* Copyright & Legal Links */}
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm">
              <p>&copy; {currentYear} GizeBook. All rights reserved.</p>
              <div className="flex gap-2">
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-gray-600">|</span>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DivCenter>
    </footer>
  );
};

export default Footer;