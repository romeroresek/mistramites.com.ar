"use client"

import dynamic from "next/dynamic"

const NotificationPrompt = dynamic(
  () => import("@/components/NotificationPrompt").then(mod => ({ default: mod.NotificationPrompt })),
  { ssr: false }
)

export function LazyNotificationPrompt() {
  return <NotificationPrompt />
}
