// components/company-componets/ServiceCard.tsx
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Zap } from "lucide-react"
import { Service } from "@/type"

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const isAvailable = service.status === 'active';

  return (
    <div className="bg-gray-50 border text-tertiary rounded-lg overflow-hidden transition-all duration-300 hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-900/20 group ">
      <div className="aspect-video relative overflow-hidden bg-green-400">
        <Image
          src={service.photo || "/placeholder-service.png"}
          alt={service.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* ✨ Price Badge overlaid on the image */}
        {service.price && (
          <Badge className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-sm border border-amber-500 text-amber-300 text-base py-1 px-3">
            {service.price}
          </Badge>
        )}
      </div>
<div className="p-4 flex flex-col justify-between space-y-8">
      <div>
        <CardTitle className="text-lg font-bold ">{service.name}</CardTitle>
        {service.description && (
          <CardDescription className="mt-1 line-clamp-2 text-slate-400">{service.description}</CardDescription>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-sm">
          {service.estimated_wait_time_mins != null && service.estimated_wait_time_mins > 0 && (
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>~{service.estimated_wait_time_mins} mins</span>
            </div>
          )}
           <Badge variant="outline" className={isAvailable ? "border-green-500/50 bg-green-700 text-white" : "border-slate-600 bg-slate-700 text-slate-400"}>
            {isAvailable ? "Available" : "Not Available"}
          </Badge>
        </div>
      </div>
      
      <div>
        <Button 
          asChild 
          className="w-full bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
          disabled={!isAvailable}
        >
          <Link href={`/booking/${service.id}`}>
            <Zap className="mr-2 h-4 w-4" />
            {isAvailable ? 'Book Now' : 'Currently Unavailable'}
          </Link>
        </Button>
      </div>
    </div>
    </div>
  )
}