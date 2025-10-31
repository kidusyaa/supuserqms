import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import NavSection from "@/components/navsection";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.gizebook.com"),
  title: {
    default: "GizeBook | Book beauty, barbershop, massage and more",
    template: "%s | GizeBook",
  },
  description:
    "Discover and book beauty services, barbershops, haircuts, massage, spa and wellness near you. Real‑time queues, appointments and easy online booking.",
  keywords: [
    "online booking",
    "beauty services",
    "beauty products",
    "barbershop",
    "haircut",
    "massage",
    "spa",
    "wellness",
    "salon",
    "queue management",
    "appointments",
  ],
  openGraph: {
    type: "website",
    url: "/",
    title: "GizeBook | Book beauty, barbershop, massage and more",
    description:
      "Book salons, barbers, massage and wellness. Compare services and reserve instantly with GizeBook.",
    siteName: "GizeBook",
    images: [{ url: "/images/logopro.png", width: 1200, height: 630, alt: "GizeBook" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GizeBook | Book beauty, barbershop, massage and more",
    description:
      "Discover and book beauty, barbershop, haircut, massage and spa services near you.",
    images: ["/images/logopro.png"],
  },
  alternates: {
    canonical: "/",
  },
  icons: "/images/logopro.svg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const SERVICES_SECTION_ID = "services-list";
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/images/logopro.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavSection servicesSectionId={SERVICES_SECTION_ID} />

        {children}
        {/* Spacer to prevent content from being hidden behind mobile bottom nav */}
        <div className="h-14 md:hidden" />
        {/* Mobile Bottom Navigation */}
        <Footer/>
        <MobileBottomNav />
        {/* JSON-LD: Organization and WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'GizeBook',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
              logo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/images/logopro.png`,
              sameAs: [
                'https://www.instagram.com/gizebook',
                'https://www.tiktok.com/@gizebookingplatform',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'GizeBook',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/services?searchTerm={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      
      </body>
    </html>
  );
}
