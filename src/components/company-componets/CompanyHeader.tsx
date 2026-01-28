// components/company-componets/CompanyHeader.tsx
import Image from "next/image";
import { MapPin, Phone, Mail, Globe, Facebook, Instagram } from "lucide-react";
import { Company } from "@/type";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CompanyHeaderProps {
  company: Company;
}

const getInitials = (name: string) => {
  if (!name) return 'CO';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  const bannerImageUrl = company.logo || "/images/one photo.jpg";

  return (
    <div className="relative w-full h-[400px] md:min-h-96 border-b ">
      {/* Background Banner Image */}
      <Image
        src={company.logo || "/images/one photo.jpg"}
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
              {company.logo ? (
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={120}
                  height={120}
                  className="rounded-xl border-2 border-border bg-card object-cover"
                />
              ) : (
                <div className="w-30 h-30 rounded-xl border-2 border-border bg-gradient-to-br from-orange-800 to-orange-00 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {getInitials(company.name)}
                  </span>
                </div>
              )}
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
