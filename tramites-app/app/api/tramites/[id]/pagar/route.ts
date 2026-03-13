import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureMercadoPagoPreference } from "@/lib/mercadopagoPreferences"
import {
  getMercadoPagoWebhookUrl,
  getPagoExitosoBackUrls,
} from "@/lib/mercadopago"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const ownerFilters: Array<{ userId: string } | { guestEmail: string }> = [
      { guestEmail: session.user.email },
    ]
    if (session.user.id) {
      ownerFilters.unshift({ userId: session.user.id })
    }

    const tramite = await prisma.tramite.findFirst({
      where: {
        id,
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
      title: "Tramites Misiones",
      amount: tramite.monto,
      userId: tramite.userId,
      payerEmail: session.user.email,
      payerName: session.user.name || undefined,
      backUrls: getPagoExitosoBackUrls(baseUrl, tramite.id),
      notificationUrl: getMercadoPagoWebhookUrl(process.env.WEBHOOK_URL),
      existingPreferenceId: tramite.pago?.mercadopagoId,
      canReuseExistingPreference:
        tramite.pago?.estado === "pendiente" && !!tramite.pago?.mercadopagoId,
    })

    const response = {
      initPoint: result.initPoint,
      reusedExistingPreference: result.reusedExistingPreference,
      preferenceId: result.preferenceId,
    }

    logTrafficMetric({
      route: "/api/tramites/[id]/pagar",
      operation: "user_payment_link",
      payloadBytes: estimateJsonPayloadBytes(response),
      rowCount: 1,
      extra: {
        tramiteId: tramite.id,
        reusedExistingPreference: result.reusedExistingPreference,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error al generar pago:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
