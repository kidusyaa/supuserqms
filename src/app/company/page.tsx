// app/companies/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { getAllCompanies } from '@/lib/supabase-utils'; // Import the new function
import type { Company } from '@/type';
import { MapPin, Clock } from 'lucide-react'; // Changed CalendarDays to Clock for working hours
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import DivCenter from '@/components/divCenter'; // Assuming this is your centralizing component
import { parseWorkingHours } from "@/lib/booking-utils"; // For working hours display

// Skeleton for a single company card (re-used from RecentJoinSection)
const CompanyCardSkeleton = () => (
  <Card className="group block bg-card border border-border rounded-xl shadow-sm overflow-hidden h-60 animate-pulse">
    <div className="relative w-full aspect-[4/3] flex items-center justify-center bg-muted/30">
      <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
        <div className="h-8 w-8 rounded-full bg-gray-300" />
      </div>
    </div>
    <div className="p-4 text-center space-y-2">
      <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
      <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto" />
    </div>
  </Card>
);

// This is an async Server Component
export default async function CompaniesPage() {
  const companies: Company[] = await getAllCompanies(); // Fetch all companies on the server

  // Helper for working hours display (Server-side, but same logic as client)
//   const getWorkingHoursDisplay = (company: Company): { text: string; isClosed: boolean } => {
//     const today = new Date().getDay(); // 0 for Sunday, 1 for Monday, etc.
//     let hoursDisplay = "Hours N/A";
//     let isClosed = true;

//     if (company.working_hours) {
//       const parsedHours:  = parseWorkingHours(company.working_hours);
//       const todaysHours = parsedHours[today];

//       if (todaysHours && todaysHours.length > 0) {
//         hoursDisplay = `${todaysHours[0].start} - ${todaysHours[0].end}`;
//         isClosed = false;
//       } else {
//         hoursDisplay = "Closed Today";
//       }
//     }
//     return { text: hoursDisplay, isClosed };
//   };


  return (
    <DivCenter>
      <section className="py-8 lg:py-16 bg-background"> {/* Adjust padding/background as needed */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              All Companies
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Browse all registered businesses on GizeBook.
            </p>
          </div>

          {companies.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <p>No companies found. Check back later!</p>
              {/* Optionally show skeletons if loading was not handled by the default async nature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <CompanyCardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {companies.map((company) => {
                // const { text: hoursDisplay, isClosed } = getWorkingHoursDisplay(company);

                return (
                  <Link
                    href={`/company/${company.id}`}
                    key={company.id}
                    className="group block bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 overflow-hidden"
                  >
                    <div className='flex flex-col h-full'> {/* Ensure full height for consistent card sizing */}
                      <div className="relative w-full aspect-[4/3] flex items-center justify-center bg-muted/30">
                        {company.logo ? (
                          <Image
                            src={company.logo}
                            alt={`${company.name} Logo`}
                            fill
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            priority={false}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xl font-bold rounded-t-xl p-2 text-center">
                            {company.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="p-4 text-center flex-grow flex flex-col justify-between"> {/* flex-grow to push "view details" to bottom */}
                        <div>
                          <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200 truncate mb-1">
                            {company.name}
                          </h3>
                          {company.location_text && (
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 truncate">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              {company.location_text}
                            </p>
                          )}
                          {/* <p className={`text-xs mt-2 opacity-80 flex items-center justify-center gap-1 ${isClosed ? 'text-red-500' : 'text-muted-foreground'}`}>
                             <Clock className="h-3 w-3 flex-shrink-0" />
                             <span>{hoursDisplay}</span>
                          </p> */}
                        </div>
                        <Button variant="ghost" className="mt-4 text-primary text-sm hover:underline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </DivCenter>
  );
}