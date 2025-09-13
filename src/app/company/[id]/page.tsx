// company/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronRight, Home, XCircle } from "lucide-react"
import Link from "next/link"
import { Company } from "@/type"
import { getCompanyWithServices } from "@/lib/supabase-utils"
import { toast } from "sonner"
import DivCenter from "@/components/divCenter"
// Import the redesigned components
import CompanyHeader from "@/components/company-componets/CompanyHeader"
import CompanyServicesList from "@/components/company-componets/CompanyServicesList"
import CompanySidebar from "@/components/company-componets/CompanySidebar"

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  const companyId = params.id as string

  useEffect(() => {
    // ... (your existing data fetching logic remains the same)
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        if (!companyId) {
          toast.error("Company ID is missing from URL.");
          router.push('/');
          return;
        }
        const companyData = await getCompanyWithServices(companyId);

        if (!companyData) {
          toast.error("Company not found");
          router.push('/');
          return;
        }

        setCompany(companyData);
      } catch (error) {
        console.error('Error fetching company data:', error);
        toast.error("Failed to load company details");
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center">
        <div className="text-center">
          {/* ✨ Themed Spinner */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Company Details...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center">
        <div className="text-center p-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
            <p className="text-slate-400 mb-6">The company you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push('/')} className="bg-amber-600 hover:bg-amber-700 text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
            </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto">
    <div className="  text-slate-200">
   <div>
      {/* ✨ Combined & Themed Navigation Bar */}
      {/* <div className="  bg-transparent border-b border-slate-700 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-sm text-slate-400">
            <Link href="/" className="flex items-center hover:text-amber-400 transition-colors">
              <Home className="h-4 w-4 mr-1.5" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-600" />
            <span className="font-medium text-slate-200">{company.name}</span>
          </nav>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="hover:bg-slate-700 hover:text-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div> */}

      {/* Company Header with Banner */}
     
      <CompanyHeader company={company} />

      {/* Main Content Area */}
      <DivCenter>
      <main className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Services List */}
          <div className="lg:col-span-2">
            <CompanyServicesList services={company.services} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CompanySidebar company={company} />
          </div>
        </div>
      </main>
      </DivCenter>
      </div>
    </div>
    </div>
  )
}