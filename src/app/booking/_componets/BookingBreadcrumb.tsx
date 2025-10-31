"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { Company } from "@/type";

interface BookingBreadcrumbProps {
  company: Company;
  serviceName?: string;
  slug?: string;
}

export default function BookingBreadcrumb({ company, serviceName, slug }: BookingBreadcrumbProps) {
  return (
    <div className="bg-gray-50 border-b">
      <div className="container mx-auto px-4 py-3 ">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/" className="flex items-center hover:text-amber-600">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/company/${company.slug ?? ""}`} className="hover:text-amber-600">
            {company.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">{serviceName ?? ""}</span>
        </nav>
      </div>
    </div>
  );
}