import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Buscar el trámite con su pago
    const tramite = await prisma.tramite.findUnique({
      where: { id },
      include: { pago: true, user: true },
    })

    if (!tramite) {
      return NextResponse.json({ error: "Trámite no encontrado" }, { status: 404 })
    }

    // Verificar que el trámite pertenece al usuario
    if (tramite.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Verificar que el pago está pendiente
    if (tramite.pago?.estado === "confirmado") {
      return NextResponse.json({ error: "Este trámite ya fue pagado" }, { status: 400 })
    }

    // Crear nueva preferencia de Mercado Pago
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const webhookUrl = process.env.WEBHOOK_URL

    const preferenceBody: any = {
      items: [
        {
          id: tramite.id,
          title: `${tramite.tipoTramite} - ${tramite.oficina}`,
          quantity: 1,
          unit_price: tramite.monto,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: session.user.email,
        name: session.user.name || undefined,
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
      return NextResponse.json({ error: "Error al crear preferencia de pago" }, { status: 500 })
    }

    // Actualizar el mercadopagoId en el pago
    await prisma.pago.update({
      where: { tramiteId: tramite.id },
      data: { mercadopagoId: result.id },
    })

    return NextResponse.json({
      initPoint: result.init_point,
    })
  } catch (error) {
    console.error("Error al generar pago:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
