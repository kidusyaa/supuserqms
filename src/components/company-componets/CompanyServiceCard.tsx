"use client";

import ServiceCard from "@/app/services/_componet/ServiceCard";
import { Service } from "@/type";

interface CompanyServiceCardProps {
  service: Service;
}

export default function CompanyServiceCard({ service }: CompanyServiceCardProps) {
  return <ServiceCard service={service} />;
}