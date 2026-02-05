import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Inicializar Mercado Pago SDK
const mercadopago = require("mercadopago")
mercadopago.configurations.setAccessToken(process.env.MERCADOPAGO_ACCESS_TOKEN)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Mercado Pago envía el ID del pago en "data.id"
    const paymentId = body.data?.id

    if (!paymentId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Obtener detalles del pago desde Mercado Pago
    const payment = await mercadopago.payment.findById(paymentId)

    if (payment.status === 200) {
      const paymentData = payment.body

      if (paymentData.status === "approved") {
        // El pago fue confirmado
        const externalReference = paymentData.external_reference

        // Actualizar el estado del pago
        await prisma.pago.update({
          where: { tramiteId: externalReference },
          data: { estado: "confirmado" },
        })

        // Actualizar el estado del trámite
        await prisma.tramite.update({
          where: { id: externalReference },
          data: { estado: "en_proceso" },
        })
      }
    }

    // Siempre responder 200 para que Mercado Pago no reintente
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Error en webhook de Mercado Pago:", error)
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
