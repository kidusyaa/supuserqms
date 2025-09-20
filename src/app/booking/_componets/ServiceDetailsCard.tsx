"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Phone, Users } from "lucide-react";
import type { Service, Company } from "@/type";
import { format, isToday } from "date-fns";

interface ServiceDetailsCardProps {
  service: Service;
  company: Company;
  queueCount: number;
  estimatedQueueStartTime: Date | null;
}

export default function ServiceDetailsCard({
  service,
  company,
  queueCount,
  estimatedQueueStartTime,
}: ServiceDetailsCardProps) {
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 bg-green-500">
          <div className="flex-shrink-0 ">
            <Image
              src={service.photo || "/placeholder-service.png"}
              alt={service.name}
              width={300}
              height={200}
              className="rounded-lg object-cover aspect-[3/2]"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{service.name}</h1>
                <p className="text-muted-foreground mb-4">{service.description}</p>
              </div>
              {service.price && (
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {service.price}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Base time: {service.estimated_wait_time_mins} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Current queue: {queueCount} people</span>
              </div>
              {estimatedQueueStartTime ? (
                <div className="flex items-center gap-2 text-orange-600 col-span-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Est. Queue Start: {format(estimatedQueueStartTime, "h:mm a")}{" "}
                    {isToday(estimatedQueueStartTime) ? "Today" : format(estimatedQueueStartTime, "MMM do")}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500 col-span-2">
                  <Clock className="h-4 w-4" />
                  <span>Est. Queue Start: Unavailable</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{company.name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{company.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Code: {service.code}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}