/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()
  const { title, body, icon, badge, url } = data

  const options: NotificationOptions = {
    body,
    icon: icon || "/icon-192x192.png",
    badge: badge || "/icon-192x192.png",
    data: { url: url || "/" },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus()
          if ("navigate" in client) {
            (client as WindowClient).navigate(url)
          }
          return
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})

export {}
