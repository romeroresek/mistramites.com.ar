import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyAdminsNewTramite } from "@/lib/tramiteNotifications"

const MONTO_PARTIDA = 20000
const MONTO_APOSTILLADO = 40000

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const body = await req.json()
    const { tipoPartida, dni, sexo, nombres, apellido, fechaNacimiento, ciudadNacimiento,
      fechaDefuncion, dni2, sexo2, nombres2, apellido2, fechaNacimiento2,
      fechaMatrimonio, ciudadMatrimonio, divorciados, whatsapp, email, apostillado } = body

    const montoTotal = MONTO_PARTIDA + (apostillado ? MONTO_APOSTILLADO : 0)

    if (!tipoPartida || !dni || !sexo || !nombres || !apellido || !fechaNacimiento) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Determinar userId y guestEmail
    let userId: string | null = null
    let guestEmail: string | null = null
    let payerEmail: string | undefined
    let payerName: string | undefined

    if (session?.user?.email) {
      // Usuario logueado
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      if (user) {
        userId = user.id
        payerEmail = user.email || undefined
        payerName = user.name || undefined
      }
    }

    if (!userId) {
      // Usuario no logueado - requiere email
      if (!email) {
        return NextResponse.json({ error: "Email requerido" }, { status: 400 })
      }
      guestEmail = email
      payerEmail = email
    }

    const tipoNombre = tipoPartida === "nacimiento" ? "Partida de Nacimiento"
      : tipoPartida === "matrimonio" ? "Partida de Matrimonio"
        : "Partida de Defunción"

    // Crear tramite + partida + pago en una transacción
    const tramite = await prisma.$transaction(async (tx) => {
      const tramite = await tx.tramite.create({
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
          tramiteId: tramite.id,
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
          apostillado: apostillado || false,
        },
      })

      await tx.pago.create({
        data: {
          tramiteId: tramite.id,
          userId,
          monto: montoTotal,
          estado: "pendiente",
        },
      })

      return tramite
    })

    // Crear preferencia de Mercado Pago
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const webhookUrl = process.env.WEBHOOK_URL

    const preferenceBody: Record<string, unknown> = {
      items: [
        {
          id: tramite.id,
          title: "Trámites Misiones",
          quantity: 1,
          unit_price: montoTotal,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: payerEmail,
        name: payerName,
      },
      external_reference: tramite.id,
      back_urls: {
        success: `${baseUrl}/pago-exitoso?tramiteId=${tramite.id}`,
        failure: `${baseUrl}/pago-exitoso?tramiteId=${tramite.id}&status=failure`,
        pending: `${baseUrl}/pago-exitoso?tramiteId=${tramite.id}&status=pending`,
      },
    }

    if (webhookUrl) {
      preferenceBody.notification_url = `${webhookUrl}/api/mercadopago/webhook`
    }

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceBody),
    })

    const result = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error("Mercado Pago API Error:", JSON.stringify(result))
      return NextResponse.json({ tramiteId: tramite.id, initPoint: null })
    }

    // Guardar el mercadopagoId en el pago
    await prisma.pago.update({
      where: { tramiteId: tramite.id },
      data: { mercadopagoId: result.id },
    })

    // Notificar a los admins del nuevo pedido
    notifyAdminsNewTramite({
      tipoTramite: tipoNombre,
      partida: { nombres, apellido },
    }).catch((err) => console.error("Error notifying admins:", err))

    return NextResponse.json({
      tramiteId: tramite.id,
      initPoint: result.init_point,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error("Error creando partida:", errorMessage)
    console.error("Stack trace:", errorStack)
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2))
    return NextResponse.json({
      error: "Error al crear la solicitud",
      details: errorMessage
    }, { status: 500 })
  }
}
