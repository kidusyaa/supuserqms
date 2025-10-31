import Homepage from "@/components/homepage";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book beauty, barbershop, haircut, massage & spa near you",
  description:
    "Find and book salons, barbershops, haircuts, massage and wellness services. Compare services, see wait times and reserve instantly with GizeBook.",
  keywords: [
    "booking",
    "beauty",
    "beauty products",
    "barbershop",
    "haircut",
    "massage",
    "spa",
    "salon",
    "wellness",
    "queue",
    "appointments",
  ],
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div>
   <Homepage/>
    {/* JSON-LD: WebPage */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GizeBook – Book beauty, barbershop, haircut, massage & spa',
          url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gizebook.com/,
          description:
            'Find and book salons, barbershops, haircuts, massage and wellness services near you.',
        }),
      }}
    />
    </div>
  );
}
