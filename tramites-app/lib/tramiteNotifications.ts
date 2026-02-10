import { sendPushNotification, NotificationPayload } from "@/lib/push"
import { prisma } from "@/lib/prisma"

const estadoMessages: Record<string, { title: string; body: string }> = {
  en_proceso: {
    title: "Tramite en proceso",
    body: "Tu tramite esta siendo procesado.",
  },
  completado: {
    title: "Tramite completado",
    body: "Tu tramite ha sido completado. Ya puedes descargar el documento.",
  },
  rechazado: {
    title: "Tramite rechazado",
    body: "Tu tramite ha sido rechazado. Consulta los detalles para mas informacion.",
  },
  aprobado: {
    title: "Tramite aprobado",
    body: "Tu tramite ha sido aprobado.",
  },
}

export async function notifyTramiteStatusChange(
  tramiteId: string,
  newStatus: string,
  userId: string
): Promise<void> {
  const message = estadoMessages[newStatus]
  if (!message) return

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) return

    const payload: NotificationPayload = {
      title: message.title,
      body: message.body,
      url: `/mis-tramites`,
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        )
      )
    )

    const failedEndpoints: string[] = []
    results.forEach((result, index) => {
      if (result.status === "rejected" || (result.status === "fulfilled" && !result.value)) {
        failedEndpoints.push(subscriptions[index].endpoint)
      }
    })

    if (failedEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: failedEndpoints } },
      })
    }
  } catch (error) {
    console.error("Error sending tramite status notification:", error)
  }
}
