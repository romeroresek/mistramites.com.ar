import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyAdminsNewTramite } from "@/lib/tramiteNotifications"
import {
  getMercadoPagoWebhookUrl,
  getPagoExitosoBackUrls,
} from "@/lib/mercadopago"
import {
  ensureMercadoPagoPreference,
  type MercadoPagoPreferenceResult,
} from "@/lib/mercadopagoPreferences"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"

const MONTO_PARTIDA = 20000

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const body = await req.json()
    const {
      tipoPartida,
      dni,
      sexo,
      nombres,
      apellido,
      fechaNacimiento,
      ciudadNacimiento,
      fechaDefuncion,
      dni2,
      sexo2,
      nombres2,
      apellido2,
      fechaNacimiento2,
      fechaMatrimonio,
      ciudadMatrimonio,
      divorciados,
      whatsapp,
      email,
    } = body

    if (!tipoPartida || !dni || !sexo || !nombres || !apellido || !fechaNacimiento) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const montoTotal = MONTO_PARTIDA
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

    const tipoNombre =
      tipoPartida === "nacimiento"
        ? "Partida de Nacimiento"
        : tipoPartida === "matrimonio"
          ? "Partida de Matrimonio"
          : "Partida de Defuncion"

    const tramite = await prisma.$transaction(async (tx) => {
      const createdTramite = await tx.tramite.create({
        data: {
          userId,
          guestEmail,
          oficina: "Registro de las Personas",
          tipoTramite: tipoNombre,
          descripcion: `Solicitud de ${tipoNombre}`,
          monto: montoTotal,
          estado: "pendiente",
        },
      })

      await tx.partida.create({
        data: {
          tramiteId: createdTramite.id,
          tipoPartida,
          whatsapp: whatsapp || null,
          dni,
          sexo,
          nombres,
          apellido,
          fechaNacimiento: new Date(fechaNacimiento),
          ciudadNacimiento: ciudadNacimiento || null,
          fechaDefuncion: fechaDefuncion ? new Date(fechaDefuncion) : null,
          dni2: dni2 || null,
          sexo2: sexo2 || null,
          nombres2: nombres2 || null,
          apellido2: apellido2 || null,
          fechaNacimiento2: fechaNacimiento2 ? new Date(fechaNacimiento2) : null,
          fechaMatrimonio: fechaMatrimonio ? new Date(fechaMatrimonio) : null,
          ciudadMatrimonio: ciudadMatrimonio || null,
          divorciados: divorciados || false,
          apostillado: false,
        },
      })

      await tx.pago.create({
        data: {
          tramiteId: createdTramite.id,
          userId,
          monto: montoTotal,
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
        amount: montoTotal,
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

    notifyAdminsNewTramite({
      tipoTramite: tipoNombre,
      partida: { nombres, apellido },
    }).catch((err) => console.error("Error notifying admins:", err))

    const response = {
      tramiteId: tramite.id,
      initPoint: preferenceResult.initPoint,
    }

    logTrafficMetric({
      route: "/api/partidas",
      operation: "partida_create",
      rowCount: 1,
      payloadBytes: estimateJsonPayloadBytes(response),
      extra: {
        tramiteId: tramite.id,
        tipoPartida,
        hasPaymentLink: !!preferenceResult.initPoint,
      },
    })

    return NextResponse.json(response)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error("Error creando partida:", errorMessage)
    console.error("Stack trace:", errorStack)
    console.error(
      "Full error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2)
    )
    return NextResponse.json(
      {
        error: "Error al crear la solicitud",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
