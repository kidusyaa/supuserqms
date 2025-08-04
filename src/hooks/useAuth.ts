"use client"

import { useState, useEffect } from "react"
import { Company, UserRole } from "@/type"

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate checking auth status
    const checkAuth = () => {
      const savedAuth = localStorage.getItem("auth")
      if (savedAuth) {
        const authData = JSON.parse(savedAuth)
        setIsAuthenticated(true)
        setUserRole(authData.role)
        if (authData.company) {
          setCurrentCompany(authData.company)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = (role: UserRole, company?: Company) => {
    setIsAuthenticated(true)
    setUserRole(role)
    if (company) {
      setCurrentCompany(company)
    }

    localStorage.setItem(
      "auth",
      JSON.stringify({
        role,
        company: company || null,
      }),
    )
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUserRole(null)
    setCurrentCompany(null)
    localStorage.removeItem("auth")
  }

  return {
    isAuthenticated,
    userRole,
    currentCompany,
    loading,
    login,
    logout,
  }
}
