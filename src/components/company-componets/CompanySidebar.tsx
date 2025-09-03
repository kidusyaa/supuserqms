// components/company-detail/CompanySidebar.tsx
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { Company } from "@/type" // Assuming Company type is defined in "@/type"

interface CompanySidebarProps {
  company: Company;
}

export default function CompanySidebar({ company }: CompanySidebarProps) {
  return (
    <Card className="sticky top-24 lg:top-4 max-w-[300px]"> {/* Adjusted top for sticky behaviour considering header */}
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {company.working_hours && (
          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Working Hours
            </h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{company.working_hours}</p>
          </div>
        )}

        {/* Only show separator if both working_hours and address exist */}
        {(company.working_hours && company.address) && <hr/>}

        {company.address && (
          <div className="">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </h4>
            <p className="text-sm text-muted-foreground mb-2">{company.address}</p>
            {company.location_link && (
           <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                <a href={company.location_link} target="_blank" rel="noopener noreferrer">
                  View on Map
                </a>
              </Button> 
            )}
          </div>
        )}

        {/* Only show separator if any of previous sections and any contact info exist */}
        {((company.working_hours || company.address) && (company.phone || company.email)) && <hr/>}

        {(company.phone || company.email) && (
          <div>
            <h4 className="font-semibold text-foreground mb-2">Contact</h4>
            <div className="space-y-2">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {company.phone}
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}