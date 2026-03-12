"use client"

import { useReportWebVitals } from "next/web-vitals"

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development, send to analytics in production
    if (process.env.NODE_ENV === "development") {
      console.log(`[Web Vital] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`)
      return
    }

    // In production, send to your analytics endpoint
    // Using navigator.sendBeacon for reliability (fires even on page unload)
    const body = JSON.stringify({
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/web-vitals", body)
    }
  })

  return null
}
