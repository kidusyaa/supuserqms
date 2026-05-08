// company/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Company } from "@/type"
import { getCompanyBySlugWithServices } from "@/lib/supabase-utils"
import { toast } from "sonner"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

import CompanyHeader from "@/components/company-componets/CompanyHeader"
import CompanyServicesList from "@/components/company-componets/CompanyServicesList"
import CompanySidebar from "@/components/company-componets/CompanySidebar"
import CompanyPhotosGallery from "@/components/company-componets/CompanyPhotosGallery"

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  const companySlug = (() => {
    const raw = String((params as any)?.slug ?? "");
    const trimmed = raw.trim().replace(/^\/+|\/+$/g, "");
    try { return decodeURIComponent(trimmed); } catch { return trimmed; }
  })();

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        if (!companySlug) return router.push('/');
        const companyData = await getCompanyBySlugWithServices(companySlug);
        if (!companyData) return router.push('/');
        setCompany(companyData);
      } catch (error) {
        toast.error("Failed to load company details");
      } finally {
        setLoading(false);
      }
    };
    if (companySlug) fetchCompanyData();
  }, [companySlug, router])

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>

  if (!company) return null;

  return (
    <div className="bg-white min-h-screen text-slate-900">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="capitalize">{company.location_text?.split(',')[0] || "City"}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-slate-900">{company.name}</span>
      </div>

      <div className="container mx-auto px-4">
        {/* Header Section */}
        <CompanyHeader company={company} />

        {/* Mosaic Photo Gallery / Slider */}
        <CompanyPhotosGallery photos={company.company_photos || []} />

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-10">
          <div className="lg:col-span-2">
            <CompanyServicesList services={company.services} />
          </div>
          <div className="lg:col-span-1">
            <CompanySidebar company={company} />
          </div>
        </main>
      </div>
    </div>
  )
}