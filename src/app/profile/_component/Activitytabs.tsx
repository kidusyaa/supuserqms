// profile/_components/ActivityTabs.tsx
"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCard } from "./Bookingcard";
import { QueueCard } from "./Queuecard";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { Booking, QueueItem } from "@/type";

interface Props {
  bookings: Booking[];
  queueEntries: QueueItem[];
  ratingsMap: Record<string, CompanyRating>;
  onRateClick: (
    sourceType: RatingSourceType,
    sourceId: string,
    companyId: string,
    companyName: string,
    existing: CompanyRating | null
  ) => void;
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-medium text-gray-700 text-sm">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

export function ActivityTabs({ bookings, queueEntries, ratingsMap, onRateClick }: Props) {
  return (
    <Tabs defaultValue="bookings">
      <TabsList className="grid grid-cols-2 w-full rounded-xl bg-gray-100 p-1">
        <TabsTrigger
          value="bookings"
          className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
        >
          Bookings
          {bookings.length > 0 && (
            <span className="ml-1.5 w-5 h-5 text-[10px] bg-amber-100 text-amber-600 rounded-full inline-flex items-center justify-center font-bold">
              {bookings.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="queue"
          className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
        >
          Queue
          {queueEntries.length > 0 && (
            <span className="ml-1.5 w-5 h-5 text-[10px] bg-amber-100 text-amber-600 rounded-full inline-flex items-center justify-center font-bold">
              {queueEntries.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Bookings */}
      <TabsContent value="bookings" className="mt-4 space-y-3">
        {bookings.length === 0 ? (
          <EmptyState icon="📅" title="No bookings yet" sub="Your appointments will appear here." />
        ) : (
          bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              rating={ratingsMap[`booking:${b.id}`] ?? null}
              onRateClick={onRateClick}
            />
          ))
        )}
      </TabsContent>

      {/* Queue */}
      <TabsContent value="queue" className="mt-4 space-y-3">
        {queueEntries.length === 0 ? (
          <EmptyState icon="🎫" title="No queue entries yet" sub="Queue sessions will appear here." />
        ) : (
          queueEntries.map((q) => (
            <QueueCard
              key={q.id}
              entry={q}
              rating={ratingsMap[`queue:${String(q.id)}`] ?? null}
              onRateClick={onRateClick}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}