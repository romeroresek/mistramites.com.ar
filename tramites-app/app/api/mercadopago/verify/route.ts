import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { prisma } from "@/lib/prisma"

interface MpPaymentData {
  id?: number
  status?: string
  external_reference?: string
  payer?: { email?: string; first_name?: string; last_name?: string; identification?: { number?: string } }
  payment_method_id?: string
  date_approved?: string
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { paymentId, tramiteId } = body

    let paymentData: MpPaymentData | null = null

    if (paymentId) {
      // Verificar por payment_id directo (viene del redirect de MP)
      const payment = new Payment(client)
      paymentData = (await payment.get({ id: Number(paymentId) })) as MpPaymentData
    } else if (tramiteId) {
      // Buscar pagos por external_reference (tramiteId)
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${tramiteId}&sort=date_created&criteria=desc&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      )
      const searchData = await response.json() as { results?: MpPaymentData[] }
      if (searchData.results && searchData.results.length > 0) {
        paymentData = searchData.results[0]
      }
    }

    if (!paymentData) {
      return NextResponse.json({ status: "not_found" }, { status: 200 })
    }

    const externalReference = paymentData.external_reference
    if (!externalReference) {
      return NextResponse.json({ status: "no_reference" }, { status: 200 })
    }

    // Mapear estados
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

    // Extraer datos del pagador
    const payer = paymentData.payer
    const payerEmail = payer?.email || null
    const payerName = payer?.first_name && payer?.last_name
      ? `${payer.first_name} ${payer.last_name}`
      : payer?.first_name || null
    const payerDni = payer?.identification?.number || null
    const paymentMethod = paymentData.payment_method_id || null
    const paymentDate = paymentData.date_approved
      ? new Date(paymentData.date_approved)
      : null

    // Actualizar estado del pago con datos del pagador
    await prisma.pago.update({
      where: { tramiteId: externalReference },
      data: {
        estado: pagoEstado,
        paymentId: String(paymentData.id),
        payerEmail,
        payerName,
        payerDni,
        paymentMethod,
        paymentDate,
      },
    })

    // Actualizar estado del trámite si fue aprobado
    if (paymentData.status === "approved") {
      await prisma.tramite.update({
        where: { id: externalReference },
        data: { estado: tramiteEstado },
      })
    }

    return NextResponse.json({
      status: paymentData.status,
      pagoEstado,
      tramiteEstado,
    })
  } catch (error: unknown) {
    console.error("Error verificando pago:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al verificar pago" }, { status: 500 })
  }
}
