// company/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { Company } from "@/type" // Ensure your Company type is correct
import { getCompanyWithServices } from "@/lib/supabase-utils" // Your actual data fetching utility
import { toast } from "sonner" // For toast notifications

// Import the new components

import CompanyHeader from "@/components/company-componets/CompanyHeader"
import CompanyServicesList from "@/components/company-componets/CompanyServicesList"
import CompanySidebar from "@/components/company-componets/CompanySidebar"
import DivCenter from "@/components/divCenter"
export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  const companyId = params.id as string; 

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true)
        if (!companyId) {
          toast.error("Company ID is missing from URL.")
          router.push('/')
          return
        }
        const companyData = await getCompanyWithServices(companyId)

        if (!companyData) {
          toast.error("Company not found")
          router.push('/')
          return
        }

        setCompany(companyData)
      } catch (error) {
        console.error('Error fetching company data:', error)
        toast.error("Failed to load company details")
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchCompanyData()
    }
  }, [companyId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading company details...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Company not found</h2>
          <p className="text-muted-foreground mb-4">The company you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="flex items-center hover:text-blue-600">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{company.name}</span>
          </nav>
        </div>
      </div>

      {/* Back button */}
      <div className="pt-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Company Header */}
      <CompanyHeader company={company} />

      {/* Main Content Area - Services and Company Info Sidebar */}
      <DivCenter>
      <div className="w-11/12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Services List */}
          <div className="lg:col-span-2">
            <CompanyServicesList services={company.services} />
          </div>

          {/* Sidebar - Company Information */}
          <div className="lg:col-span-1 mt-16">
            <CompanySidebar company={company} />
          </div>
        </div>
      </div>
 </DivCenter>
    </div>
  )
}