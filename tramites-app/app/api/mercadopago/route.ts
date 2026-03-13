import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureMercadoPagoPreference } from "@/lib/mercadopagoPreferences"
import {
  getMercadoPagoWebhookUrl,
  getMisTramitesBackUrls,
} from "@/lib/mercadopago"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { tramiteId } = body as { tramiteId?: string }

    if (!tramiteId) {
      return NextResponse.json({ error: "tramiteId requerido" }, { status: 400 })
    }

    const ownerFilters: Array<{ userId: string } | { guestEmail: string }> = [
      { guestEmail: session.user.email },
    ]
    if (session.user.id) {
      ownerFilters.unshift({ userId: session.user.id })
    }

    const tramite = await prisma.tramite.findFirst({
      where: {
        id: tramiteId,
        OR: ownerFilters,
      },
      select: {
        id: true,
        monto: true,
        userId: true,
        pago: {
          select: {
            estado: true,
            mercadopagoId: true,
          },
        },
      },
    })

    if (!tramite) {
      return NextResponse.json({ error: "Tramite no encontrado" }, { status: 404 })
    }

    if (tramite.pago?.estado === "confirmado") {
      return NextResponse.json({ error: "Este tramite ya fue pagado" }, { status: 400 })
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const result = await ensureMercadoPagoPreference({
      tramiteId: tramite.id,
      title: "Tramite",
      amount: tramite.monto,
      userId: tramite.userId,
      payerEmail: session.user.email,
      payerName: session.user.name || undefined,
      backUrls: getMisTramitesBackUrls(baseUrl),
      notificationUrl: getMercadoPagoWebhookUrl(process.env.WEBHOOK_URL),
      autoReturnApproved: baseUrl.startsWith("https://"),
      existingPreferenceId: tramite.pago?.mercadopagoId,
      canReuseExistingPreference:
        tramite.pago?.estado === "pendiente" && !!tramite.pago?.mercadopagoId,
    })

    const response = {
      preferenceId: result.preferenceId,
      initPoint: result.initPoint,
      reusedExistingPreference: result.reusedExistingPreference,
    }

    logTrafficMetric({
      route: "/api/mercadopago",
      operation: "mercadopago_preference_from_tramite",
      payloadBytes: estimateJsonPayloadBytes(response),
      rowCount: 1,
      extra: {
        tramiteId: tramite.id,
        reusedExistingPreference: result.reusedExistingPreference,
      },
    })

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error("Mercado Pago Error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: "Error al crear preferencia de pago" },
      { status: 500 }
    )
  }
}
