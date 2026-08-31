// Centralized Database Company Types & Category Icons
export interface CategoryIconInfo {
  id: string;
  name: string;
  icon: string;
  bg: string;
  text: string;
  search: string;
}

export const DATABASE_CATEGORIES: CategoryIconInfo[] = [
  {
    id: "ctyp_156b471c64d6f6b623c8",
    name: "Massage & Spa Center",
    icon: "cil:spa",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-800 dark:text-teal-300",
    search: "massage",
  },
  {
    id: "ctyp_53db2f13758e8f8902a3",
    name: "Barbershop",
    icon: "solar:scissors-linear",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-800 dark:text-cyan-300",
    search: "barber",
  },
  {
    id: "ctyp_87d2396dc140f2a0ac79",
    name: "Skincare Clinic",
    icon: "wpf:facial-recognition-scan",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-800 dark:text-emerald-300",
    search: "skin",
  },
  {
    id: "ctyp_974b4c1e55d1287e6e61",
    name: "Nail Studio",
    icon: "icon-park-outline:mascara",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-800 dark:text-sky-300",
    search: "nail",
  },
  {
    id: "ctyp_df467f8e523cb5d2ce49",
    name: "Makeup Artist",
    icon: "icon-park-outline:cosmetic-brush",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-800 dark:text-purple-300",
    search: "makeup",
  },
  {
    id: "ctyp_bac74dcb5e1ea9d4cdac",
    name: "Beauty Salon",
    icon: "game-icons:hair-strands",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-800 dark:text-amber-300",
    search: "beauty",
  },
];

/**
 * Returns matching category icon info for any service name, category name, or company type
 */
export function getCategoryIconInfo(
  serviceName?: string,
  categoryName?: string,
  companyTypeName?: string
): CategoryIconInfo {
  const text = `${serviceName || ""} ${categoryName || ""} ${companyTypeName || ""}`.toLowerCase();

  // 1. Barbershop
  if (
    text.includes("barber") ||
    text.includes("haircut") ||
    text.includes("beard") ||
    text.includes("men's grooming") ||
    text.includes("fade")
  ) {
    return DATABASE_CATEGORIES[1];
  }

  // 2. Massage & Spa Center
  if (
    text.includes("massage") ||
    text.includes("spa") ||
    text.includes("wellness") ||
    text.includes("therapy") ||
    text.includes("reflexology") ||
    text.includes("swedish") ||
    text.includes("sauna")
  ) {
    return DATABASE_CATEGORIES[0];
  }

  // 3. Skincare Clinic
  if (
    text.includes("skin") ||
    text.includes("facial") ||
    text.includes("clinic") ||
    text.includes("dermat") ||
    text.includes("peel") ||
    text.includes("hydra")
  ) {
    return DATABASE_CATEGORIES[2];
  }

  // 4. Nail Studio
  if (
    text.includes("nail") ||
    text.includes("manicure") ||
    text.includes("pedicure") ||
    text.includes("gel") ||
    text.includes("acrylic")
  ) {
    return DATABASE_CATEGORIES[3];
  }

  // 5. Makeup Artist
  if (
    text.includes("makeup") ||
    text.includes("bridal") ||
    text.includes("cosmetic") ||
    text.includes("glam") ||
    text.includes("lash") ||
    text.includes("brow")
  ) {
    return DATABASE_CATEGORIES[4];
  }

  // 6. Beauty Salon
  if (
    text.includes("beauty") ||
    text.includes("hair") ||
    text.includes("salon") ||
    text.includes("braid") ||
    text.includes("blowout") ||
    text.includes("color") ||
    text.includes("styling")
  ) {
    return DATABASE_CATEGORIES[5];
  }

  // Default fallback
  return DATABASE_CATEGORIES[5];
}
