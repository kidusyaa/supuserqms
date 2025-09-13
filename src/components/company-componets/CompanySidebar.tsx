// components/company-componets/CompanySidebar.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Clock, Globe, Facebook, Instagram, ExternalLink } from "lucide-react"
import type { Company, DailyWorkingHours, WorkingHoursJsonb } from "@/type"
import { getDay, format } from 'date-fns';
import { parseWorkingHours } from "@/lib/booking-utils";
import { Icon } from "@iconify/react/dist/iconify.js";

interface CompanySidebarProps {
  company: Company;
}

// ✨ Helper component for cleaner info items
const InfoItem = ({ icon: Icon, children }: { icon: React.ElementType, children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-5 w-5 text-amber-400 mt-1 flex-shrink-0" />
    <div className="text-sm text-slate-300">{children}</div>
  </div>
);

export default function CompanySidebar({ company }: CompanySidebarProps) {
  return (
    <Card className="sticky top-24 bg-gray-50  text-tertiary ">
      <CardHeader>
        <CardTitle className="text-xl textte">Company Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Info Section */}
        <div className="space-y-4">
          <h4 className="font-semibold">Contact</h4>
          {company.phone && (
            <InfoItem icon={Phone}>
              <a href={`tel:${company.phone}`} className="hover:text-amber-400 transition-colors text-tertiary ">
                {company.phone}
              </a>
            </InfoItem>
          )}
          {company.email && (
            <InfoItem icon={Mail}>
              <a href={`mailto:${company.email}`} className="hover:text-amber-400 transition-colors text-tertiary">
                {company. email}
              </a>
            </InfoItem>
          )}
        </div>

        {/* Address Section */}
        {company.address && (
          <div className="space-y-4 border-t border-slate-700  ">
            <h4 className="font-semibold ">Location</h4>
            <InfoItem icon={MapPin}>
              <p className="text-tertiary">{company.address}</p>
            </InfoItem>
            {company.location_link && (
              <Button variant="outline" size="sm" asChild className="w-full bg-transparent  text-amber-500 hover:bg-primary hover:text-white ">
                <a href={company.location_link} target="_blank" rel="noopener noreferrer" className="text-tertiary">
                  <ExternalLink className="w-4 h-4 mr-2 " />
                  View on Map
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Working Hours Section */}
        {company.working_hours && (
          <div className="space-y-2  border-t pt-2 border-slate-700">
             <h4 className="font-semibold    ">Working Hours</h4>
            <InfoItem icon={Clock}>
               {/* Same logic, just wrapped in the new component */}
               {(() => {
                if (typeof company.working_hours !== 'object' || company.working_hours === null) {
                    return <span className="text-red-400">Not Available</span>;
                }
                const parsedHours = parseWorkingHours(company.working_hours as WorkingHoursJsonb);
                const today = new Date();
                const dayOfWeek = getDay(today);
                const rangesForToday = parsedHours[dayOfWeek];

                if (rangesForToday && rangesForToday.length > 0) {
                    return <span className="font-medium text-green-400">Open Today: {rangesForToday.map(r => `${format(r.start, "h:mm a")} - ${format(r.end, "h:mm a")}`).join(', ')}</span>;
                }
                return <span className="text-tertiary">Closed Today</span>;
               })()}
            </InfoItem>
          </div>
        )}

      </CardContent>
    </Card>
  )
}

// ✨ Helper for social icon buttons
const SocialButton = ({ href, icon: Icon }: { href: string, icon: React.ElementType }) => (
    <Button variant="outline" size="icon" className="bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-amber-500 text-slate-300 hover:text-amber-400" asChild>
        <a href={href} target="_blank" rel="noopener noreferrer">
            <Icon className="w-5 h-5" />
        </a>
    </Button>
)