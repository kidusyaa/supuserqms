import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChevronRight, Zap } from "lucide-react";

// ✨ CORRECTED IMPORT: Get the type from your central types file. This fixes the error.

import {  ServiceWithDetails } from "@/type";
interface ServiceCardProps {
  service: ServiceWithDetails;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  // Your logic for icons might need to be more robust based on service.type
  const icon = service.type === "Beauty" ? "✂️" : "🚗";

  return (
    <Link href={`/userservice/${service.id}`} className="block">
      <Card className="group overflow-hidden bg-white border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-400">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-3xl">
              {icon}
            </div>
            {service.queueCount === 0 && (
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <Zap className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
            )}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
            <div className="md:col-span-2">
              <h3 className="font-semibold text-slate-800 truncate">{service.name}</h3>
              <p className="text-sm text-slate-500 truncate">{service.company?.name}</p>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{service.estimatedWaitTime} min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{service.queueCount} in queue</span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="text-lg font-bold text-slate-900 mb-1">{service.price}</div>
              {service.queueCount === 0 ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">No Wait</Badge>
              ) : (
                <div className="hidden md:flex justify-end items-center text-slate-400">
                    <span>Details</span>
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}