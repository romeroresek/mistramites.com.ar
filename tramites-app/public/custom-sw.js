// Custom service worker for push notifications

self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()
  const { title, body, icon, badge, url } = data

  const options = {
    body,
    icon: icon || "/icon-192x192.png",
    badge: badge || "/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: { url: url || "/" },
    actions: [
      { action: "open", title: "Ver" },
      { action: "close", title: "Cerrar" },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "close") return

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
