import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago"
import { prisma } from "@/lib/prisma"
import { notifyAdminsNewPayment } from "@/lib/tramiteNotifications"
import { logPago } from "@/lib/activityLog"

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

    // Detectar reembolsos (devolución desde la app de MP puede no actualizar status en la notificación)
    const raw = paymentData as { refunds?: { id?: number }[]; status_detail?: string; statusDetail?: string; transaction_amount?: number; transaction_amount_refunded?: number }
    const hasRefundsArray = Array.isArray(raw.refunds) && raw.refunds.length > 0
    const statusDetail = raw.status_detail ?? raw.statusDetail
    const isRefundedByDetail = statusDetail === "refunded" || statusDetail === "partially_refunded"
    const amount = Number(raw.transaction_amount ?? 0)
    const amountRefunded = Number(raw.transaction_amount_refunded ?? 0)
    const isRefundedByAmount = amount > 0 && amountRefunded >= amount

    let hasRefundsFromApi = hasRefundsArray
    if (!hasRefundsFromApi && !isRefundedByDetail && !isRefundedByAmount && paymentData.status === "approved" && paymentId) {
      try {
        const refundClient = new PaymentRefund(client)
        const refundList = await refundClient.list({ payment_id: paymentId })
        hasRefundsFromApi = Array.isArray(refundList) && refundList.length > 0
        if (!hasRefundsFromApi) {
          const rawResp = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
            { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
          )
          if (rawResp.ok) {
            const rawRefunds = await rawResp.json()
            hasRefundsFromApi = Array.isArray(rawRefunds) && rawRefunds.length > 0
          }
        }
      } catch {
        // ignorar
      }
    }

    // Mapear estado de pago (solo pago, NO afecta al trámite)
    let pagoEstado = "pendiente"

    if (hasRefundsArray || hasRefundsFromApi || isRefundedByDetail || isRefundedByAmount || paymentData.status === "refunded" || paymentData.status === "charged_back") {
      pagoEstado = "devuelto"
    } else {
      switch (paymentData.status) {
        case "approved":
          pagoEstado = "confirmado"
          break
        case "pending":
        case "in_process":
          pagoEstado = "pendiente"
          break
        case "rejected":
        case "cancelled":
          pagoEstado = "rechazado"
          break
      }
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

    // Obtener estado anterior del pago para detectar si realmente cambió
    const pagoAnterior = await prisma.pago.findUnique({
      where: { tramiteId: externalReference },
      select: { estado: true },
    })

    // Obtener monto del trámite para el caso de crear Pago si no existe
    const tramite = await prisma.tramite.findUnique({
      where: { id: externalReference },
      select: { monto: true, userId: true },
    })

    // Actualizar o crear SOLO el registro de pago (nunca tocar el estado del trámite)
    await prisma.pago.upsert({
      where: { tramiteId: externalReference },
      update: {
        estado: pagoEstado,
        paymentId: String(paymentId),
        payerEmail,
        payerName,
        payerDni,
        paymentMethod,
        paymentDate,
      },
      create: {
        tramiteId: externalReference,
        userId: tramite?.userId || null,
        monto: tramite?.monto || 0,
        estado: pagoEstado,
        paymentId: String(paymentId),
        payerEmail,
        payerName,
        payerDni,
        paymentMethod,
        paymentDate,
      },
    })

    // El estado del trámite es 100% manual (lo maneja el admin)
    // No se modifica automáticamente por cambios en el pago

    // Notificar admins si el pago cambió a "confirmado" (nuevo pago confirmado)
    const pagoChanged = !pagoAnterior || pagoAnterior.estado !== pagoEstado
    if (pagoChanged && pagoEstado === "confirmado") {
      notifyAdminsNewPayment(externalReference, payerName).catch((err) =>
        console.error("Error notifying admins of payment:", err)
      )
    }

    // Registrar actividad de pago si cambió el estado
    if (pagoChanged) {
      const tipoLog = pagoEstado === "confirmado" ? "confirmado" :
                      pagoEstado === "devuelto" ? "reembolsado" :
                      pagoEstado === "rechazado" ? "fallido" : "iniciado"
      await logPago({
        tipo: tipoLog as "confirmado" | "fallido" | "reembolsado" | "iniciado",
        tramiteId: externalReference,
        monto: tramite?.monto || 0,
        userId: tramite?.userId,
        userEmail: payerEmail,
        paymentId: String(paymentId),
        metadata: {
          payerName,
          paymentMethod,
          status: paymentData.status,
        },
      })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Error en webhook de Mercado Pago:", error)
    // Siempre responder 200 para que Mercado Pago no reintente indefinidamente
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
