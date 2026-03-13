import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyAdminsNewTramite } from "@/lib/tramiteNotifications"
import { logTramiteCreado } from "@/lib/activityLog"
import { userTramiteListSelect } from "@/lib/tramiteSelects"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"
import {
  getMercadoPagoWebhookUrl,
  getPagoExitosoBackUrls,
} from "@/lib/mercadopago"
import {
  ensureMercadoPagoPreference,
  type MercadoPagoPreferenceResult,
} from "@/lib/mercadopagoPreferences"

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const ownerFilters: Array<{ userId: string } | { guestEmail: string }> = [
      { guestEmail: session.user.email },
    ]
    if (session.user.id) {
      ownerFilters.unshift({ userId: session.user.id })
    }

    const tramites = await prisma.tramite.findMany({
      where: {
        OR: ownerFilters,
      },
      select: userTramiteListSelect,
      orderBy: { createdAt: "desc" },
    })

    logTrafficMetric({
      route: "/api/tramites",
      operation: "user_tramites_list",
      rowCount: tramites.length,
      payloadBytes: estimateJsonPayloadBytes(tramites),
    })

    return NextResponse.json(tramites)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener tramites" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const body = await req.json()
    const { oficina, tipoTramite, descripcion, monto, whatsapp, email } = body

    if (!oficina || !tipoTramite || !monto) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    let userId: string | null = null
    let guestEmail: string | null = null
    let payerEmail: string | undefined
    let payerName: string | undefined

    if (session?.user?.email) {
      userId = session.user.id || null
      payerEmail = session.user.email
      payerName = session.user.name || undefined
    }

    if (!userId) {
      if (!email) {
        return NextResponse.json({ error: "Email requerido" }, { status: 400 })
      }
      guestEmail = email
      payerEmail = email
    }

    const tramite = await prisma.$transaction(async (tx) => {
      const createdTramite = await tx.tramite.create({
        data: {
          userId,
          guestEmail,
          oficina,
          tipoTramite,
          descripcion: descripcion || "",
          monto,
          estado: "pendiente",
          whatsapp: whatsapp || null,
        },
      })

      await tx.pago.create({
        data: {
          tramiteId: createdTramite.id,
          userId,
          monto,
          estado: "pendiente",
        },
      })

      return createdTramite
    })

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    let preferenceResult: MercadoPagoPreferenceResult

    try {
      preferenceResult = await ensureMercadoPagoPreference({
        tramiteId: tramite.id,
        title: "Tramites Misiones",
        amount: monto,
        userId,
        payerEmail,
        payerName,
        backUrls: getPagoExitosoBackUrls(baseUrl, tramite.id),
        notificationUrl: getMercadoPagoWebhookUrl(process.env.WEBHOOK_URL),
      })
    } catch (error) {
      console.error("Mercado Pago API Error:", error)
      return NextResponse.json({ tramiteId: tramite.id, initPoint: null })
    }

    await logTramiteCreado({
      tramiteId: tramite.id,
      tipoTramite,
      userId,
      userEmail: payerEmail || guestEmail,
      userName: payerName,
      monto,
    })

    notifyAdminsNewTramite({
      tipoTramite,
      partida: null,
    }).catch((err) => console.error("Error notifying admins:", err))

    const response = {
      tramiteId: tramite.id,
      initPoint: preferenceResult.initPoint,
    }

    logTrafficMetric({
      route: "/api/tramites",
      operation: "user_tramite_create",
      rowCount: 1,
      payloadBytes: estimateJsonPayloadBytes(response),
      extra: {
        tramiteId: tramite.id,
        hasPaymentLink: !!preferenceResult.initPoint,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear tramite" }, { status: 500 })
  }
}
