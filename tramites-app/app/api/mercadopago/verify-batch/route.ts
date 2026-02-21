import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago"
import { prisma } from "@/lib/prisma"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

interface MpPaymentData {
  id?: number
  status?: string
  status_detail?: string
  external_reference?: string
  payer?: { email?: string; first_name?: string; last_name?: string; identification?: { number?: string } }
  payment_method_id?: string
  date_approved?: string
  transaction_amount?: number
  transaction_amount_refunded?: number
  refunds?: { id?: number; status?: string; amount?: number }[]
}

async function fetchPaymentById(paymentId: number): Promise<MpPaymentData | null> {
  try {
    const payment = new Payment(client)
    return (await payment.get({ id: paymentId })) as MpPaymentData
  } catch {
    return null
  }
}

async function searchByExternalReference(tramiteId: string): Promise<MpPaymentData | null> {
  try {
    // Buscar primero pagos aprobados
    const approvedResp = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${tramiteId}&status=approved&sort=date_created&criteria=desc&limit=1`,
      { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
    )
    const approvedData = await approvedResp.json() as { results?: MpPaymentData[] }
    if (approvedData.results && approvedData.results.length > 0) {
      return approvedData.results[0]
    }
    // Fallback: cualquier pago
    const anyResp = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${tramiteId}&sort=date_created&criteria=desc&limit=1`,
      { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
    )
    const anyData = await anyResp.json() as { results?: MpPaymentData[] }
    if (anyData.results && anyData.results.length > 0) {
      return anyData.results[0]
    }
  } catch {
    // ignorar
  }
  return null
}

function detectRefund(paymentData: MpPaymentData): boolean {
  const hasRefundsArray = Array.isArray(paymentData.refunds) && paymentData.refunds.length > 0
  const statusDetail = paymentData.status_detail
  const isRefundedByDetail = statusDetail === "refunded" || statusDetail === "partially_refunded"
  const amount = Number(paymentData.transaction_amount ?? 0)
  const amountRefunded = Number(paymentData.transaction_amount_refunded ?? 0)
  const isRefundedByAmount = amount > 0 && amountRefunded >= amount
  return hasRefundsArray || isRefundedByDetail || isRefundedByAmount ||
    paymentData.status === "refunded" || paymentData.status === "charged_back"
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { tramiteIds } = body as { tramiteIds: string[] }

    if (!Array.isArray(tramiteIds) || tramiteIds.length === 0) {
      return NextResponse.json({ updated: false, results: [] })
    }

    // Limitar a 20 trámites por request
    const ids = tramiteIds.slice(0, 20)

    // Verificar todos en paralelo
    const results = await Promise.all(
      ids.map(async (tramiteId) => {
        try {
          // Primero buscar el paymentId guardado en la DB para usar lookup directo
          const pago = await prisma.pago.findUnique({
            where: { tramiteId },
            select: { paymentId: true },
          })

          let paymentData: MpPaymentData | null = null

          if (pago?.paymentId && /^\d+$/.test(pago.paymentId)) {
            // Lookup directo por paymentId (incluye refunds[], status_detail, transaction_amount_refunded)
            paymentData = await fetchPaymentById(Number(pago.paymentId))
          }

          if (!paymentData) {
            // Fallback a búsqueda por external_reference
            paymentData = await searchByExternalReference(tramiteId)
            // Si encontramos por búsqueda, hacer lookup directo para obtener refunds
            if (paymentData?.id) {
              const detailed = await fetchPaymentById(paymentData.id)
              if (detailed) paymentData = detailed
            }
          }

          if (!paymentData?.external_reference && !paymentData?.id) return { tramiteId, updated: false }

          // Detectar reembolso
          let isRefunded = detectRefund(paymentData)

          // Si no hay refund detectado aún y el pago está aprobado, consultar endpoint de refunds
          if (!isRefunded && paymentData.status === "approved" && paymentData.id) {
            try {
              const refundClient = new PaymentRefund(client)
              const refundList = await refundClient.list({ payment_id: paymentData.id })
              if (Array.isArray(refundList) && refundList.length > 0) {
                isRefunded = true
              }
            } catch {
              // ignorar
            }
          }

          let pagoEstado = "pendiente"
          let tramiteEstado = "pendiente"

          if (isRefunded) {
            pagoEstado = "devuelto"
            tramiteEstado = "pendiente"
          } else {
            switch (paymentData.status) {
              case "approved":
                pagoEstado = "confirmado"
                tramiteEstado = "en_proceso"
                break
              case "rejected":
              case "cancelled":
                pagoEstado = "rechazado"
                break
              case "pending":
              case "in_process":
                pagoEstado = "pendiente"
                break
            }
          }

          const payer = paymentData.payer
          const payerEmail = payer?.email || null
          const payerName = payer?.first_name && payer?.last_name
            ? `${payer.first_name} ${payer.last_name}`
            : payer?.first_name || null
          const payerDni = payer?.identification?.number || null
          const paymentMethod = paymentData.payment_method_id || null
          const paymentDate = paymentData.date_approved ? new Date(paymentData.date_approved) : null

          // Obtener monto del trámite para crear Pago si no existe
          const tramite = await prisma.tramite.findUnique({
            where: { id: tramiteId },
            select: { monto: true, userId: true },
          })

          await prisma.pago.upsert({
            where: { tramiteId },
            update: {
              estado: pagoEstado,
              paymentId: String(paymentData.id),
              payerEmail,
              payerName,
              payerDni,
              paymentMethod,
              paymentDate,
            },
            create: {
              tramiteId,
              userId: tramite?.userId || null,
              monto: tramite?.monto || 0,
              estado: pagoEstado,
              paymentId: String(paymentData.id),
              payerEmail,
              payerName,
              payerDni,
              paymentMethod,
              paymentDate,
            },
          })

          // Solo actualizar estado si está en "pendiente" (respetar cambios manuales del admin)
          if (pagoEstado === "confirmado") {
            await prisma.tramite.updateMany({
              where: { id: tramiteId, estado: "pendiente" },
              data: { estado: tramiteEstado },
            })
          } else if (pagoEstado === "devuelto") {
            await prisma.tramite.update({
              where: { id: tramiteId },
              data: { estado: "pendiente" },
            })
          }

          return { tramiteId, updated: true, pagoEstado }
        } catch {
          return { tramiteId, updated: false }
        }
      })
    )

    const anyUpdated = results.some((r) => r.updated)
    return NextResponse.json({ updated: anyUpdated, results })
  } catch (error: unknown) {
    console.error("Error verify-batch:", error)
    return NextResponse.json({ error: "Error al verificar pagos" }, { status: 500 })
  }
}
