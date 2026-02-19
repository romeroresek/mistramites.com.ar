import { sendPushNotification, NotificationPayload } from "@/lib/push"
import { prisma } from "@/lib/prisma"

interface TramiteInfo {
  tipoTramite: string
  partida?: {
    nombres: string
    apellido: string
  } | null
}

export async function notifyAdminsNewTramite(tramite: TramiteInfo): Promise<void> {
  try {
    // Buscar admins con notificaciones push habilitadas
    const admins = await prisma.user.findMany({
      where: {
        role: "admin",
        pushNotificationsEnabled: true,
      },
      include: {
        pushSubscriptions: true,
      },
    })

    if (admins.length === 0) return

    const nombreCliente = tramite.partida
      ? `${tramite.partida.nombres} ${tramite.partida.apellido}`
      : "Cliente"

    const payload: NotificationPayload = {
      title: "Nuevo pedido",
      body: `${nombreCliente} - ${tramite.tipoTramite}`,
      url: "/admin",
    }

    const allSubscriptions = admins.flatMap((admin) => admin.pushSubscriptions)
    if (allSubscriptions.length === 0) return

    const results = await Promise.allSettled(
      allSubscriptions.map((sub) =>
        sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        )
      )
    )

    const failedEndpoints: string[] = []
    results.forEach((result, index) => {
      if (result.status === "rejected" || (result.status === "fulfilled" && !result.value)) {
        failedEndpoints.push(allSubscriptions[index].endpoint)
      }
    })

    if (failedEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: failedEndpoints } },
      })
    }
  } catch (error) {
    console.error("Error notifying admins of new tramite:", error)
  }
}

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
