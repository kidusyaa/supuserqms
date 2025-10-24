"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

const items = [
  { name: "Home", href: "/", icon: "material-symbols:home-outline" },
  { name: "Services", href: "/services", icon: "solar:hand-stars-linear" },
  { name: "Companies", href: "/company", icon: "iconoir:shop-four-tiles" },

];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto max-w-screen-md">
        <ul className="flex items-center justify-between px-4 py-2" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {items.map((item) => (
            <li key={item.name} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-amber-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon
                  icon={item.icon}
                  width="24"
                  height="24"
                  className={isActive(item.href) ? "text-amber-600" : "text-gray-500"}
                />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
