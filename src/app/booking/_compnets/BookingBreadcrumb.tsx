"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { Company } from "@/type";

interface BookingBreadcrumbProps {
  company: Company;
  serviceName: string;
}

export default function BookingBreadcrumb({ company, serviceName }: BookingBreadcrumbProps) {
  return (
    <div className="bg-gray-50 border-b">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/" className="flex items-center hover:text-blue-600">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/company/${company.id}`} className="hover:text-blue-600">
            {company.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">{serviceName}</span>
        </nav>
      </div>
    </div>
  );
}