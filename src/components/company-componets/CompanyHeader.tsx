// components/company-detail/CompanyHeader.tsx
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Globe, Facebook, Instagram } from "lucide-react"
import { Company } from "@/type" // Assuming Company type is defined in "@/type"
import { Icon } from "@iconify/react/dist/iconify.js"
import DivCenter from "../divCenter"
interface CompanyHeaderProps {
  company: Company;
}

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <DivCenter>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-shrink-0">
            <Image
              src={company.logo || "/placeholder-company.png"}
              alt={`${company.name} logo`}
              width={120}
              height={120}
              className="rounded-xl border-2 border-border bg-card object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
              {company.location_text && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{company.location_text}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{company.phone}</span>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{company.email}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {company.socials?.website && (
                <Button variant="outline" size="sm" asChild>
                  <a href={company.socials.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
              {company.socials?.facebook && (
                <Button variant="outline" size="sm" asChild>
                  <a href={company.socials.facebook} target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </a>
                </Button>
              )}
              {company.socials?.instagram && (
                <Button variant="outline" size="sm" asChild>
                  <a href={company.socials.instagram} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </a>
                </Button>
              )}
              {company.socials?.tiktok && (
                <Button variant="outline" size="sm" asChild>
                  <a href={company.socials.tiktok} target="_blank" rel="noopener noreferrer">
                    <Icon icon="proicons:tiktok" width="24" height="24" />
                    Tiktok
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      </DivCenter>
    </div>
  )
}