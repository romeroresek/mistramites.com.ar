import webpush from "web-push"

// Configure web-push with VAPID keys
if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  data?: Record<string, unknown>
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        ...payload,
        icon: payload.icon || "/icon-192x192.png",
        badge: payload.badge || "/icon-192x192.png",
      })
    )
    return true
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number }
    console.error("[Push Error] Reason:", err.message)
    // Si el error es 410 (Gone) o 404 (Not Found), la suscripción ya no es válida
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.warn("[Push Warning] Subscription is expired or no longer valid.")
    }
    return false
  }
}

export { webpush }
