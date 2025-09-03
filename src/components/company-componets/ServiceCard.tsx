// components/company-detail/ServiceCard.tsx
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { Service } from "@/type" // Assuming Service type is defined in "@/type"

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative">
        <Image
          src={service.photo || "/placeholder-service.png"}
          alt={service.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
            {service.description && (
              <CardDescription className="mt-1 line-clamp-2">{service.description}</CardDescription>
            )}
          </div>
          {service.price && (
            <Badge variant="secondary" className="ml-2">
              {service.price}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          {service.estimated_wait_time_mins != null && service.estimated_wait_time_mins > 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>~{service.estimated_wait_time_mins} mins</span>
            </div>
          ) : null}
          <Badge variant={service.status === "active" ? "default" : "secondary"}>
            {service.status === "active" ? "Available" : "Not Available"}
          </Badge>
        </div>
        <Link href={`/booking/${service.id}`} className="w-full">
          <Button className="w-full" disabled={service.status !== 'active'}>
            {service.status === 'active' ? 'Book Now' : 'Not Available'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}