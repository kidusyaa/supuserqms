// components/company-componets/CompanyHeader.tsx
import Image from "next/image";
import { MapPin, Phone, Mail, Globe, Facebook, Instagram } from "lucide-react";
import { Company } from "@/type";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "@/components/ui/button";

interface CompanyHeaderProps {
  company: Company;
}

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  // ✨ Use a company-specific banner or a fallback
  // const bannerImageUrl = company.banner_image || "/default-banner.jpg";

  return (
    <div className="relative w-full h-[400px] md:min-h-96 border-b ">
      {/* Background Banner Image */}
      <Image
        src={company.logo || "/placeholder-company.png"}
        alt={`${company.name} banner`}
        fill
        className="object-cover"
        priority
      />
      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end p-4 md:p-8">
        <div className="container md:mx-20 mx-auto px-4 py-8 ">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0">
              <Image
                src={
                  company.logo ||
                  "/placeholder.svg?height=120&width=120&query=company logo"
                }
                alt={`${company.name} logo`}
                width={120}
                height={120}
                className="rounded-xl border-2 border-border bg-card"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {company.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-white mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{company.location_text}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{company.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{company.email}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-tertiary">
                {company.socials?.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={company.socials.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                {company.socials?.facebook && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={company.socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </a>
                  </Button>
                )}
                {company.socials?.instagram && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={company.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </a>
                  </Button>
                )}
                {company.socials?.tiktok && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={company.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="h-4 w-4 mr-2" />
                      TikTok
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
