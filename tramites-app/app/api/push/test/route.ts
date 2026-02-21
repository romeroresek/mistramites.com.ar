import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendPushNotification } from "@/lib/push"
import { prisma } from "@/lib/prisma"

// GET: enviar notificación de prueba al admin actual
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { pushSubscriptions: true },
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Diagnóstico
    const diagnostics = {
      userId: user.id,
      email: user.email,
      role: user.role,
      pushNotificationsEnabled: user.pushNotificationsEnabled,
      totalSubscriptions: user.pushSubscriptions.length,
      subscriptions: user.pushSubscriptions.map((s) => ({
        id: s.id,
        endpoint: s.endpoint.substring(0, 60) + "...",
        createdAt: s.createdAt,
      })),
    }

    if (user.pushSubscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No tenés suscripciones push activas. Activá las notificaciones primero.",
        diagnostics,
      })
    }

    if (!user.pushNotificationsEnabled) {
      return NextResponse.json({
        success: false,
        error: "pushNotificationsEnabled está desactivado en tu cuenta. Activá el toggle de notificaciones.",
        diagnostics,
      })
    }

    // Enviar notificación de prueba
    const results = await Promise.allSettled(
      user.pushSubscriptions.map((sub) =>
        sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          {
            title: "Notificación de prueba",
            body: "Si ves esto, las notificaciones push funcionan correctamente.",
            url: "/admin",
          }
        )
      )
    )

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value
    ).length

    // Limpiar suscripciones fallidas
    const failedEndpoints: string[] = []
    results.forEach((result, index) => {
      if (
        result.status === "rejected" ||
        (result.status === "fulfilled" && !result.value)
      ) {
        failedEndpoints.push(user.pushSubscriptions[index].endpoint)
      }
    })

    if (failedEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: failedEndpoints } },
      })
    }

    return NextResponse.json({
      success: successCount > 0,
      sent: successCount,
      failed: results.length - successCount,
      diagnostics,
    })
  } catch (error) {
    console.error("Error en push test:", error)
    return NextResponse.json(
      { error: "Error al enviar notificación de prueba" },
      { status: 500 }
    )
  }
}
