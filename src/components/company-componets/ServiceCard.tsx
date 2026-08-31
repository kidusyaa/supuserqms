// components/company-componets/ServiceCard.tsx
"use client";

import ServiceCard from "@/app/services/_componet/ServiceCard";
import { Service } from "@/type";

interface ServiceCardProps {
  service: Service;
}

export default function CompanyComponentServiceCard({ service }: ServiceCardProps) {
  return <ServiceCard service={service} />;
}
