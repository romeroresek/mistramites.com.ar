import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { tramiteId } = body

    if (!tramiteId) {
      return NextResponse.json({ error: "tramiteId requerido" }, { status: 400 })
    }

    const tramite = await prisma.tramite.findUnique({
      where: { id: tramiteId },
      include: { user: true },
    })

    if (!tramite) {
      return NextResponse.json({ error: "Trámite no encontrado" }, { status: 404 })
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const webhookUrl = process.env.WEBHOOK_URL

    // Llamar a la API REST de Mercado Pago directamente
    const isProduction = baseUrl.startsWith("https://")

    const preferenceBody: any = {
      items: [
        {
          id: tramiteId,
          title: tramite.tipoTramite,
          quantity: 1,
          unit_price: tramite.monto,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: tramite.user?.email || tramite.guestEmail || undefined,
        name: tramite.user?.name || "Invitado",
      },
      external_reference: tramiteId,
      back_urls: {
        success: `${baseUrl}/mis-tramites`,
        failure: `${baseUrl}/mis-tramites`,
        pending: `${baseUrl}/mis-tramites`,
      },
    }

    // auto_return solo funciona con URLs HTTPS (producción)
    if (isProduction) {
      preferenceBody.auto_return = "approved"
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
      console.error("Mercado Pago API Error:", JSON.stringify(result, null, 2))
      console.error("Status:", mpResponse.status)
      console.error("Preference body sent:", JSON.stringify(preferenceBody, null, 2))
      return NextResponse.json({ error: "Error al crear preferencia", details: result }, { status: 500 })
    }

    await prisma.pago.upsert({
      where: { tramiteId: tramiteId },
      update: { mercadopagoId: result.id },
      create: {
        tramiteId: tramiteId,
        userId: tramite.userId,
        monto: tramite.monto,
        mercadopagoId: result.id,
      },
    })

    return NextResponse.json({
      preferenceId: result.id,
      initPoint: result.init_point,
    })
  } catch (error: any) {
    console.error("Mercado Pago Error:", error?.message)
    console.error("Full error:", error)
    return NextResponse.json({ error: "Error al crear preferencia de pago", details: error?.message }, { status: 500 })
  }
}
