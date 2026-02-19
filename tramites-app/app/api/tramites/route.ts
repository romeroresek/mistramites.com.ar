import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyAdminsNewTramite } from "@/lib/tramiteNotifications"

// GET: obtener todos los trámites del usuario
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const tramites = await prisma.tramite.findMany({
      where: {
        OR: [
          { userId: user.id },
          { guestEmail: session.user.email },
        ],
      },
      include: {
        documentos: true,
        pago: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(tramites)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener trámites" }, { status: 500 })
  }
}

// POST: crear nuevo trámite (permite usuarios logueados o invitados con email)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const body = await req.json()
    const { oficina, tipoTramite, descripcion, monto, whatsapp, email } = body

    if (!oficina || !tipoTramite || !monto) {
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

    // Crear trámite y pago
    const tramite = await prisma.$transaction(async (tx) => {
      const tramite = await tx.tramite.create({
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
          tramiteId: tramite.id,
          userId,
          monto,
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
          title: `${tipoTramite} - Trámites Misiones`,
          quantity: 1,
          unit_price: monto,
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
      tipoTramite,
      partida: null,
    }).catch((err) => console.error("Error notifying admins:", err))

    return NextResponse.json({
      tramiteId: tramite.id,
      initPoint: result.init_point,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear trámite" }, { status: 500 })
  }
}
