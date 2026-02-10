import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendPushNotification, NotificationPayload } from "@/lib/push"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { userId, title, body: notificationBody, url } = body

    if (!title || !notificationBody) {
      return NextResponse.json(
        { error: "Titulo y mensaje son requeridos" },
        { status: 400 }
      )
    }

    const whereClause = userId ? { userId } : {}
    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
    })

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: "No hay suscripciones activas" },
        { status: 404 }
      )
    }

    const payload: NotificationPayload = {
      title,
      body: notificationBody,
      url: url || "/mis-tramites",
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

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value
    ).length

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: results.length - successCount,
    })
  } catch (error) {
    console.error("Error al enviar notificacion:", error)
    return NextResponse.json(
      { error: "Error al enviar notificacion" },
      { status: 500 }
    )
  }
}
