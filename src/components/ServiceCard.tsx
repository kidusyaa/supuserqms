import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, MapPin, Tag } from "lucide-react";
import { ServiceWithDetails } from "@/type"; // Assuming you have this type
import Image from "next/image";
interface ServiceCardProps {
  service: ServiceWithDetails;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link href={`/service/${service.id}`} className="block group">
      <Card className="overflow-hidden bg-white border-slate-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="text-3xl p-3 bg-slate-100 rounded-lg">
                <Image src={service.company?.logo || '🏢'} alt={service.name} width={120} height={120} className="object-contain"/>
            
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-indigo-600 font-semibold truncate">
                {service.company?.name ?? 'Unknown Company'}
              </p>
              <h3 className="font-bold text-lg text-slate-800 truncate">
                {service.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                 <MapPin className="w-3 h-3" />
                 <span>{service.company?.location || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-3">
             <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="flex items-center gap-1.5" title="Estimated Wait Time">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{service.estimatedWaitTime} min</span>
                </div>
                <div className="flex items-center gap-1.5" title="People in Queue">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>{service.queueCount}</span>
                </div>
             </div>
             <div className="text-lg font-bold text-slate-800 flex items-center gap-1">
                <Tag className="w-4 h-4 text-green-600" />
                <span>{service.price}</span>
             </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}