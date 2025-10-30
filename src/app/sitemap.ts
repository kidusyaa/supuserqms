import type { MetadataRoute } from "next";
import { getAllCategories } from "@/lib/supabase-utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gizebook.com";

// Single sitemap implementation combining static and dynamic routes
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/company`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/usercategory`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  try {
    const categories = await getAllCategories();
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${SITE_URL}/usercategory/${c.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    return [...staticRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
