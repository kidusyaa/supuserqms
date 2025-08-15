// src/components/Footer.tsx
"use client";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
     
    <footer className="bg-gradient-to-r from-orange-500 from-10% via-orange-500 via-30% to-amber-500 to-90% text-white py-10 mt-12">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row md:justify-between gap-10 md:gap-20">
          
          {/* Logo + Description */}
          <div className="flex-1">
            <Link href="/" className="flex items-center space-x-3">
              {/* Replace with your logo image */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">B</span>
              </div>
              <span className="text-lg font-semibold">BookEasy</span>
            </Link>
            <p className="mt-4 text-sm text-orange-100 leading-relaxed">
              Book different services from multiple companies with ease.  
              Optimized for mobile — booking made simple.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Quick Links</h3>
            <ul className="space-y-2 text-orange-100">
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Go to All Services
                </Link>
              </li>
              <li>
                <Link href="/register-company" className="hover:text-white transition-colors">
                  Register as a Company
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Contact Us</h3>
            <ul className="space-y-3 text-orange-100">
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+123 456 789</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>support@bookeasy.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>123 Main St, City</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/200 mt-10 pt-6 text-center text-sm text-white">
          © {new Date().getFullYear()} BookEasy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
