import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { prisma } from "@/lib/prisma"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Mercado Pago envía diferentes tipos de notificaciones
    const { type, data } = body

    // Solo procesamos notificaciones de pago
    if (type !== "payment") {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const paymentId = data?.id
    if (!paymentId) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // Obtener detalles del pago desde Mercado Pago
    const payment = new Payment(client)
    const paymentData = await payment.get({ id: paymentId })

    if (!paymentData) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const externalReference = paymentData.external_reference
    if (!externalReference) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // Mapear estados de Mercado Pago a nuestros estados
    let pagoEstado = "pendiente"
    let tramiteEstado = "pendiente"

    switch (paymentData.status) {
      case "approved":
        pagoEstado = "confirmado"
        tramiteEstado = "en_proceso"
        break
      case "pending":
      case "in_process":
        pagoEstado = "pendiente"
        tramiteEstado = "pendiente"
        break
      case "rejected":
      case "cancelled":
        pagoEstado = "rechazado"
        tramiteEstado = "pendiente"
        break
    }

    // Actualizar el estado del pago
    await prisma.pago.update({
      where: { tramiteId: externalReference },
      data: { estado: pagoEstado },
    })

    // Actualizar el estado del trámite si el pago fue aprobado
    if (paymentData.status === "approved") {
      await prisma.tramite.update({
        where: { id: externalReference },
        data: { estado: tramiteEstado },
      })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Error en webhook de Mercado Pago:", error)
    // Siempre responder 200 para que Mercado Pago no reintente indefinidamente
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
