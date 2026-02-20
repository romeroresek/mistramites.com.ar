import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago"
import { prisma } from "@/lib/prisma"

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
    let { paymentId } = body
    const { tramiteId } = body

    let paymentData: MpPaymentData | null = null

    // Si solo tenemos tramiteId, buscar si ya hay un paymentId guardado en la DB
    if (!paymentId && tramiteId) {
      const pago = await prisma.pago.findUnique({
        where: { tramiteId },
        select: { paymentId: true },
      })
      if (pago?.paymentId) {
        paymentId = pago.paymentId
      }
    }

    const searchByExternalReference = async () => {
      if (!tramiteId) return null
      // Buscar primero pagos aprobados (el usuario pudo haber tenido intentos rechazados antes)
      const approvedResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${tramiteId}&status=approved&sort=date_created&criteria=desc&limit=1`,
        { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
      )
      const approvedData = await approvedResponse.json() as { results?: MpPaymentData[] }
      if (approvedData.results && approvedData.results.length > 0) {
        return approvedData.results[0]
      }
      // Si no hay aprobado, tomar el más reciente (puede ser refunded, pending, etc.)
      const anyResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${tramiteId}&sort=date_created&criteria=desc&limit=1`,
        { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
      )
      const anyData = await anyResponse.json() as { results?: MpPaymentData[] }
      if (anyData.results && anyData.results.length > 0) {
        return anyData.results[0]
      }
      return null
    }

    try {
      if (paymentId && /^\d+$/.test(paymentId)) {
        // Verificar por payment_id directo (más confiable para detectar reembolsos)
        try {
          const payment = new Payment(client)
          paymentData = (await payment.get({ id: Number(paymentId) })) as MpPaymentData
        } catch {
          // Si falla (404, id inválido), fallback a búsqueda por external_reference
          paymentData = await searchByExternalReference()
        }
      } else {
        // Buscar pagos por external_reference (tramiteId) - para pagos nuevos
        paymentData = await searchByExternalReference()
      }
    } catch (mpError) {
      console.error("Error consultando MercadoPago:", mpError instanceof Error ? mpError.message : mpError)
      return NextResponse.json({ status: "mp_error", updated: false }, { status: 200 })
    }

    if (!paymentData) {
      return NextResponse.json({ status: "not_found", updated: false }, { status: 200 })
    }

    // Usar tramiteId original si lo tenemos, sino usar external_reference de MP
    const targetTramiteId = tramiteId || paymentData.external_reference
    if (!targetTramiteId) {
      return NextResponse.json({ status: "no_reference", updated: false }, { status: 200 })
    }

    // Detectar si tiene reembolsos (MP puede mantener status "approved" cuando se devuelve desde la app de MP)
    const hasRefundsArray = Array.isArray(paymentData.refunds) && paymentData.refunds.length > 0
    const statusDetail = paymentData.status_detail ?? (paymentData as { statusDetail?: string }).statusDetail
    const isRefundedByDetail = statusDetail === "refunded" || statusDetail === "partially_refunded"
    const amount = Number(paymentData.transaction_amount ?? 0)
    const amountRefunded = Number(paymentData.transaction_amount_refunded ?? 0)
    const isRefundedByAmount = amount > 0 && amountRefunded >= amount

    // Si no vino refunds en la respuesta y el pago está aprobado, consultar endpoint de refunds
    // (la app de MP a veces no actualiza status en GET payment)
    // Solo consultar para pagos aprobados para evitar llamadas innecesarias
    let hasRefundsFromApi = hasRefundsArray
    if (!hasRefundsFromApi && !isRefundedByDetail && !isRefundedByAmount && paymentData.status === "approved" && paymentData.id) {
      try {
        // Intentar primero con SDK
        const refundClient = new PaymentRefund(client)
        const refundList = await refundClient.list({ payment_id: paymentData.id })
        hasRefundsFromApi = Array.isArray(refundList) && refundList.length > 0
        if (!hasRefundsFromApi) {
          // Fallback: raw REST fetch para evitar posibles problemas del SDK
          const rawRefundResp = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentData.id}/refunds`,
            { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
          )
          if (rawRefundResp.ok) {
            const rawRefunds = await rawRefundResp.json()
            hasRefundsFromApi = Array.isArray(rawRefunds) && rawRefunds.length > 0
          }
        }
      } catch (e) {
        console.warn("[verify] No se pudo listar refunds via SDK, intentando raw fetch:", e instanceof Error ? e.message : e)
        try {
          const rawRefundResp = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentData.id}/refunds`,
            { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
          )
          if (rawRefundResp.ok) {
            const rawRefunds = await rawRefundResp.json()
            hasRefundsFromApi = Array.isArray(rawRefunds) && rawRefunds.length > 0
          }
        } catch (e2) {
          console.warn("[verify] Raw fetch de refunds también falló:", e2 instanceof Error ? e2.message : e2)
        }
      }
    }

    console.log(`[verify] Payment ${paymentData.id}: status=${paymentData.status}, status_detail=${statusDetail}, transaction_amount_refunded=${amountRefunded}, refunds=${JSON.stringify(paymentData.refunds ?? [])}, hasRefundsFromApi=${hasRefundsFromApi}`)

    // Mapear estados
    let pagoEstado = "pendiente"
    let tramiteEstado = "pendiente"

    if (hasRefundsArray || hasRefundsFromApi || isRefundedByDetail || isRefundedByAmount || paymentData.status === "refunded" || paymentData.status === "charged_back") {
      // Pago devuelto (por status, status_detail, o presencia de refunds)
      pagoEstado = "devuelto"
      tramiteEstado = "cancelado"
    } else {
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

    // Obtener monto del trámite para el caso de crear Pago si no existe
    const tramite = await prisma.tramite.findUnique({
      where: { id: targetTramiteId },
      select: { monto: true, userId: true },
    })

    // Actualizar o crear registro de pago con datos del pagador
    await prisma.pago.upsert({
      where: { tramiteId: targetTramiteId },
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
        tramiteId: targetTramiteId,
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

    // Actualizar estado del trámite: al aprobar → en_proceso; al devolver → pendiente (no dejar cancelado)
    if (pagoEstado === "confirmado") {
      await prisma.tramite.update({
        where: { id: targetTramiteId },
        data: { estado: tramiteEstado },
      })
    } else if (pagoEstado === "devuelto") {
      await prisma.tramite.update({
        where: { id: targetTramiteId },
        data: { estado: "cancelado" },
      })
    }

    return NextResponse.json({
      status: paymentData.status,
      pagoEstado,
      tramiteEstado,
      paymentId: paymentData.id ? String(paymentData.id) : null,
      updated: true,
    })
  } catch (error: unknown) {
    console.error("Error verificando pago:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al verificar pago" }, { status: 500 })
  }
}
