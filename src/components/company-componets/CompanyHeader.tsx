// components/company-componets/CompanyHeader.tsx
import Image from "next/image"
import { MapPin, Phone, Mail, Globe, Facebook, Instagram } from "lucide-react"
import { Company } from "@/type"
import { Icon } from "@iconify/react/dist/iconify.js"
import { Button } from "@/components/ui/button"

interface CompanyHeaderProps {
  company: Company;
}

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  // ✨ Use a company-specific banner or a fallback
  // const bannerImageUrl = company.banner_image || "/default-banner.jpg";

  return (
    <div className="relative w-full h-64 md:h-80 border-b border-slate-700">
      {/* Background Banner Image */}
      <Image
        src={"/images/auto.png "}
        alt={`${company.name} banner`}
        fill
        className="object-cover"
        priority
      />
      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Image
              src={company.logo || "/placeholder-company.png"}
              alt={`${company.name} logo`}
              width={128}
              height={128}
              className="rounded-xl border-4 border-slate-700 bg-slate-800 object-cover flex-shrink-0 -mb-12 md:-mb-16 shadow-lg"
            />
            <div className="md:mt-4">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-md">{company.name}</h1>
              {company.location_text && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="h-4 w-4 text-amber-400" />
                    <span>{company.location_text}</span>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}