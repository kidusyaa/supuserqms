import React from 'react'
import Link from 'next/link'
import DivCenter from './divCenter'
import { Button } from './ui/button'

import ServiceCategoriesPage from './ServiceCategoriesPage'
import NavSection from './navsection'
import { StatsFs } from 'node:fs'
import StatsSection from './StatsSection'
import FeaturedServices from './Featuredservice'
import Footer from './footer'

export default function Homepage() {
  const SERVICES_SECTION_ID = "services-list";
  return (
    <div>
      <NavSection servicesSectionId={SERVICES_SECTION_ID} />
      <StatsSection/>
      <FeaturedServices/>
      <ServiceCategoriesPage/>
      <Footer/>
    </div>
  )
}
