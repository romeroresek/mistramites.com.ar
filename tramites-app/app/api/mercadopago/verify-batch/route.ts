import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago"
import { prisma } from "@/lib/prisma"
import { notifyAdminsNewPayment } from "@/lib/tramiteNotifications"
import { hasPaymentStateChanged, type PaymentSyncFields } from "@/lib/paymentSync"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const VERIFY_BATCH_MAX_IDS = 20
const VERIFY_BATCH_PARALLELISM = 4

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

interface VerifiedPaymentPayload {
  estado: string
  paymentId: string | null
  payerEmail: string | null
  payerName: string | null
  payerDni: string | null
  paymentMethod: string | null
  paymentDate: string | null
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
    const ids = Array.from(
      new Set(
        tramiteIds
          .filter((id): id is string => typeof id === "string")
          .map((id) => id.trim())
          .filter(Boolean)
      )
    ).slice(0, VERIFY_BATCH_MAX_IDS)

    const ownerFilters: Array<{ userId: string } | { guestEmail: string }> = [
      { guestEmail: session.user.email },
    ]
    if (session.user.id) {
      ownerFilters.unshift({ userId: session.user.id })
    }

    const tramiteWhere =
      session.user.role === "admin"
        ? { id: { in: ids } }
        : {
            id: { in: ids },
            OR: ownerFilters,
          }

    const [pagos, tramites] = await Promise.all([
      prisma.pago.findMany({
        where: { tramiteId: { in: ids } },
        select: {
          tramiteId: true,
          estado: true,
          paymentId: true,
          payerEmail: true,
          payerName: true,
          payerDni: true,
          paymentMethod: true,
          paymentDate: true,
        },
      }),
      prisma.tramite.findMany({
        where: tramiteWhere,
        select: { id: true, monto: true, userId: true, guestEmail: true },
      }),
    ])

    const pagosByTramite = new Map(pagos.map((pago) => [pago.tramiteId, pago]))
    const tramitesById = new Map(tramites.map((tramite) => [tramite.id, tramite]))
    const accessibleIds = tramites.map((tramite) => tramite.id)
    const results: Array<{
      tramiteId: string
      updated: boolean
      pagoEstado?: string
      pago?: VerifiedPaymentPayload
    }> = []

    for (let i = 0; i < accessibleIds.length; i += VERIFY_BATCH_PARALLELISM) {
      const chunk = accessibleIds.slice(i, i + VERIFY_BATCH_PARALLELISM)
      const chunkResults = await Promise.all(
        chunk.map(async (tramiteId) => {
          try {
            const pago = pagosByTramite.get(tramiteId)
            const tramiteData = tramitesById.get(tramiteId)

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

          // Mapear estado de pago (solo pago, NO afecta al trámite)
          let pagoEstado = "pendiente"

          if (isRefunded) {
            pagoEstado = "devuelto"
          } else {
            switch (paymentData.status) {
              case "approved":
                pagoEstado = "confirmado"
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

          const nextPayment: PaymentSyncFields = {
            estado: pagoEstado,
            paymentId: paymentData.id ? String(paymentData.id) : null,
            payerEmail,
            payerName,
            payerDni,
            paymentMethod,
            paymentDate,
          }

          const pagoChanged = hasPaymentStateChanged(
            pago
              ? {
                  estado: pago.estado,
                  paymentId: pago.paymentId,
                  payerEmail: pago.payerEmail,
                  payerName: pago.payerName,
                  payerDni: pago.payerDni,
                  paymentMethod: pago.paymentMethod,
                  paymentDate: pago.paymentDate,
                }
              : null,
            nextPayment
          )

          // Obtener monto del trámite para crear Pago si no existe
          const tramite = tramiteData ?? await prisma.tramite.findUnique({
            where: { id: tramiteId },
            select: { monto: true, userId: true, guestEmail: true },
          })

          if (!tramite) {
            return { tramiteId, updated: false }
          }

          if (pagoChanged) {
            await prisma.pago.upsert({
              where: { tramiteId },
              update: nextPayment,
              create: {
                tramiteId,
                userId: tramite.userId || null,
                monto: tramite.monto || 0,
                ...nextPayment,
              },
            })
          }

          // El estado del trámite es 100% manual (lo maneja el admin)

          if (pagoChanged && pagoEstado === "confirmado") {
            notifyAdminsNewPayment(tramiteId, payerName).catch((err) =>
              console.error("Error notifying admins of payment:", err)
            )
          }

          return {
            tramiteId,
            updated: pagoChanged,
            pagoEstado,
            pago: {
              estado: nextPayment.estado,
              paymentId: nextPayment.paymentId,
              payerEmail: nextPayment.payerEmail,
              payerName: nextPayment.payerName,
              payerDni: nextPayment.payerDni,
              paymentMethod: nextPayment.paymentMethod,
              paymentDate: nextPayment.paymentDate instanceof Date
                ? nextPayment.paymentDate.toISOString()
                : nextPayment.paymentDate,
            },
          }
        } catch {
          return { tramiteId, updated: false }
        }
        })
      )

      results.push(...chunkResults)
    }

    const changedCount = results.filter((result) => result.updated).length
    const response = {
      updated: changedCount > 0,
      changedCount,
      verifiedCount: results.length,
      results,
    }

    logTrafficMetric({
      route: "/api/mercadopago/verify-batch",
      operation: "mercadopago_verify_batch",
      payloadBytes: estimateJsonPayloadBytes(response),
      rowCount: results.length,
      changedCount,
    })

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error("Error verify-batch:", error)
    return NextResponse.json({ error: "Error al verificar pagos" }, { status: 500 })
  }
}
