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
    <Card className="sticky top-24 bg-slate-800 border-slate-700 text-slate-200">
      <CardHeader>
        <CardTitle className="text-xl text-white">Company Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Info Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white">Contact</h4>
          {company.phone && (
            <InfoItem icon={Phone}>
              <a href={`tel:${company.phone}`} className="hover:text-amber-400 transition-colors">
                {company.phone}
              </a>
            </InfoItem>
          )}
          {company.email && (
            <InfoItem icon={Mail}>
              <a href={`mailto:${company.email}`} className="hover:text-amber-400 transition-colors">
                {company.email}
              </a>
            </InfoItem>
          )}
        </div>

        {/* Address Section */}
        {company.address && (
          <div className="space-y-4 border-t border-slate-700 pt-6">
            <h4 className="font-semibold text-white">Location</h4>
            <InfoItem icon={MapPin}>
              <p>{company.address}</p>
            </InfoItem>
            {company.location_link && (
              <Button variant="outline" size="sm" asChild className="w-full bg-transparent border-amber-500 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400">
                <a href={company.location_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Map
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Working Hours Section */}
        {company.working_hours && (
          <div className="space-y-4 border-t border-slate-700 pt-6">
             <h4 className="font-semibold text-white">Working Hours</h4>
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
                return <span className="text-slate-400">Closed Today</span>;
               })()}
            </InfoItem>
          </div>
        )}

        {/* Social Links Section */}
        <div className="space-y-4 border-t border-slate-700 pt-6">
          <h4 className="font-semibold text-white">Follow Us</h4>
          <div className="flex flex-wrap gap-2">
            {company.socials?.website && <SocialButton href={company.socials.website} icon={Globe} />}
            {company.socials?.facebook && <SocialButton href={company.socials.facebook} icon={Facebook} />}
            {company.socials?.instagram && <SocialButton href={company.socials.instagram} icon={Instagram} />}
            {company.socials?.tiktok && <SocialButton href={company.socials.tiktok} icon={() => <Icon icon="simple-icons:tiktok" className="w-4 h-4" />} />}
          </div>
        </div>
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