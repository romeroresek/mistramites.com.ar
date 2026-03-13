import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago"
import { prisma } from "@/lib/prisma"
import { notifyAdminsNewPayment } from "@/lib/tramiteNotifications"
import { logPago } from "@/lib/activityLog"
import { hasPaymentStateChanged, type PaymentSyncFields } from "@/lib/paymentSync"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body as { type?: string; data?: { id?: number } }

    if (type !== "payment") {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const paymentId = data?.id
    if (!paymentId) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const payment = new Payment(client)
    const paymentData = await payment.get({ id: paymentId })

    if (!paymentData?.external_reference) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const externalReference = paymentData.external_reference
    const raw = paymentData as {
      refunds?: { id?: number }[]
      status_detail?: string
      statusDetail?: string
      transaction_amount?: number
      transaction_amount_refunded?: number
    }

    const hasRefundsArray = Array.isArray(raw.refunds) && raw.refunds.length > 0
    const statusDetail = raw.status_detail ?? raw.statusDetail
    const isRefundedByDetail =
      statusDetail === "refunded" || statusDetail === "partially_refunded"
    const amount = Number(raw.transaction_amount ?? 0)
    const amountRefunded = Number(raw.transaction_amount_refunded ?? 0)
    const isRefundedByAmount = amount > 0 && amountRefunded >= amount

    let hasRefundsFromApi = hasRefundsArray
    if (
      !hasRefundsFromApi &&
      !isRefundedByDetail &&
      !isRefundedByAmount &&
      paymentData.status === "approved"
    ) {
      try {
        const refundClient = new PaymentRefund(client)
        const refundList = await refundClient.list({ payment_id: paymentId })
        hasRefundsFromApi = Array.isArray(refundList) && refundList.length > 0

        if (!hasRefundsFromApi) {
          const rawResp = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
            {
              headers: {
                Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
              },
            }
          )
          if (rawResp.ok) {
            const rawRefunds = await rawResp.json()
            hasRefundsFromApi = Array.isArray(rawRefunds) && rawRefunds.length > 0
          }
        }
      } catch {
        // Ignorar errores de refund lookup.
      }
    }

    let pagoEstado = "pendiente"

    if (
      hasRefundsArray ||
      hasRefundsFromApi ||
      isRefundedByDetail ||
      isRefundedByAmount ||
      paymentData.status === "refunded" ||
      paymentData.status === "charged_back"
    ) {
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

    const payer = paymentData.payer
    const payerEmail = payer?.email || null
    const payerName =
      payer?.first_name && payer?.last_name
        ? `${payer.first_name} ${payer.last_name}`
        : payer?.first_name || null
    const payerDni = payer?.identification?.number || null
    const paymentMethod = paymentData.payment_method_id || null
    const paymentDate = paymentData.date_approved
      ? new Date(paymentData.date_approved)
      : null

    const pagoAnterior = await prisma.pago.findUnique({
      where: { tramiteId: externalReference },
      select: {
        estado: true,
        paymentId: true,
        payerEmail: true,
        payerName: true,
        payerDni: true,
        paymentMethod: true,
        paymentDate: true,
      },
    })

    const tramite = await prisma.tramite.findUnique({
      where: { id: externalReference },
      select: { monto: true, userId: true },
    })

    const nextPayment: PaymentSyncFields = {
      estado: pagoEstado,
      paymentId: String(paymentId),
      payerEmail,
      payerName,
      payerDni,
      paymentMethod,
      paymentDate,
    }

    const pagoChanged = hasPaymentStateChanged(
      pagoAnterior
        ? {
            estado: pagoAnterior.estado,
            paymentId: pagoAnterior.paymentId,
            payerEmail: pagoAnterior.payerEmail,
            payerName: pagoAnterior.payerName,
            payerDni: pagoAnterior.payerDni,
            paymentMethod: pagoAnterior.paymentMethod,
            paymentDate: pagoAnterior.paymentDate,
          }
        : null,
      nextPayment
    )

    if (pagoChanged) {
      await prisma.pago.upsert({
        where: { tramiteId: externalReference },
        update: nextPayment,
        create: {
          tramiteId: externalReference,
          userId: tramite?.userId || null,
          monto: tramite?.monto || 0,
          ...nextPayment,
        },
      })
    }

    if (pagoChanged && pagoEstado === "confirmado") {
      notifyAdminsNewPayment(externalReference, payerName).catch((err) =>
        console.error("Error notifying admins of payment:", err)
      )
    }

    if (pagoChanged) {
      const tipoLog =
        pagoEstado === "confirmado"
          ? "confirmado"
          : pagoEstado === "devuelto"
            ? "reembolsado"
            : pagoEstado === "rechazado"
              ? "fallido"
              : "iniciado"

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

    const response = { ok: true, updated: pagoChanged, tramiteId: externalReference }

    logTrafficMetric({
      route: "/api/mercadopago/webhook",
      operation: "mercadopago_webhook",
      payloadBytes: estimateJsonPayloadBytes(response),
      rowCount: 1,
      changedCount: pagoChanged ? 1 : 0,
      extra: {
        tramiteId: externalReference,
        paymentId: String(paymentId),
      },
    })

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Error en webhook de Mercado Pago:", error)
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
