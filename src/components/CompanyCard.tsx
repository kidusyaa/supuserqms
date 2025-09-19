// components/CompanyCard.tsx

import Link from "next/link";
import { Company } from "@/type";
import { LocationEdit, Phone } from "lucide-react";// You might need to install heroicons: npm install @heroicons/react

// A placeholder image for companies without a logo
const DEFAULT_LOGO = "/placeholder-logo.png"; // Add a placeholder image to your /public folder

type CompanyCardProps = {
  company: Company;
};

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
 <Link href={`/company/${company.id}`} passHref>
      <div className="group  bg-white rounded-lg border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
        <div className="relative w-full h-40 bg-gray-200">
          {/* Company Logo/Image */}
          <img
            src={company.logo || DEFAULT_LOGO}
            alt={`${company.name} logo`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
            {company.name}
          </h3>

          {company.location_text && (
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <LocationEdit className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{company.location_text}</span>
            </div>
          )}

          {company.phone && (
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{company.phone}</span>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-200 flex-grow flex items-end">
             <span className="text-sm font-semibold text-orange-600 group-hover:underline">
                View Details
             </span>
          </div>
        </div>
      </div>
    </Link>
  );
}