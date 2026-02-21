import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MercadoPagoConfig, PaymentRefund } from "mercadopago"
import { prisma } from "@/lib/prisma"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id: tramiteId } = await params

    const pago = await prisma.pago.findUnique({
      where: { tramiteId },
      select: { paymentId: true, estado: true },
    })

    if (!pago) {
      return NextResponse.json({ error: "No se encontró el pago" }, { status: 404 })
    }
    if (!pago.paymentId) {
      return NextResponse.json({ error: "Este trámite no tiene ID de pago de Mercado Pago" }, { status: 400 })
    }
    if (pago.estado !== "confirmado") {
      return NextResponse.json({ error: "Solo se pueden devolver pagos confirmados" }, { status: 400 })
    }

    // Ejecutar la devolución total en Mercado Pago
    const refundClient = new PaymentRefund(client)
    await refundClient.total({ payment_id: Number(pago.paymentId) })

    // Actualizar pago y trámite en la DB
    await prisma.pago.update({
      where: { tramiteId },
      data: { estado: "devuelto" },
    })
    await prisma.tramite.update({
      where: { id: tramiteId },
      data: { estado: "cancelado" },
    })

    const tramiteActualizado = await prisma.tramite.findUnique({
      where: { id: tramiteId },
      include: {
        user: { select: { name: true, email: true } },
        pago: true,
        partida: true,
      },
    })

    return NextResponse.json({ ok: true, tramite: tramiteActualizado })
  } catch (error: unknown) {
    console.error("Error al hacer devolución:", error)

    // Intentar extraer mensaje detallado de la API de Mercado Pago
    let msg = "Error al procesar la devolución"
    if (error && typeof error === "object") {
      const err = error as Record<string, unknown>
      if (err.message && typeof err.message === "string") {
        msg = err.message
      }
      // El SDK de MercadoPago puede incluir detalles en cause o apiResponse
      if (err.cause) {
        console.error("Causa del error MP:", JSON.stringify(err.cause, null, 2))
      }
      if (err.status) {
        console.error("Status MP:", err.status)
      }
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
