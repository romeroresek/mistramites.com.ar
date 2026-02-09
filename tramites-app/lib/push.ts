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
  } catch (error) {
    console.error("Error sending push notification:", error)
    return false
  }
}

export { webpush }
