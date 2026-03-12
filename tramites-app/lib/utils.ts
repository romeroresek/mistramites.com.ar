import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cached date formatter instances (avoid creating Intl objects on every render)
const dateFormatter = new Intl.DateTimeFormat("es-AR")
const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

export function formatDateAR(dateStr: string): string {
  const d = new Date(dateStr)
  return dateFormatter.format(d)
}

export function formatDateTimeAR(dateStr: string): string {
  const d = new Date(dateStr)
  return `${dateFormatter.format(d)} ${timeFormatter.format(d)}`
}
