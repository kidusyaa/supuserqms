import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (emojis, etc.)
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with a hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading or trailing hyphens
}
