import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

// Endpoint temporal de diagnóstico — solo admins
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const paymentId = searchParams.get("paymentId")

  if (!paymentId) {
    return NextResponse.json({ error: "Falta paymentId" }, { status: 400 })
  }

  // 1) SDK payment.get()
  let sdkData: Record<string, unknown> | null = null
  let sdkError: string | null = null
  try {
    const payment = new Payment(client)
    const raw = await payment.get({ id: Number(paymentId) })
    sdkData = raw as unknown as Record<string, unknown>
  } catch (e) {
    sdkError = String(e)
  }

  // 2) SDK PaymentRefund.list()
  let sdkRefunds: unknown = null
  let sdkRefundsError: string | null = null
  try {
    const refundClient = new PaymentRefund(client)
    sdkRefunds = await refundClient.list({ payment_id: Number(paymentId) })
  } catch (e) {
    sdkRefundsError = String(e)
  }

  // 3) Raw fetch del pago (sin SDK)
  let rawPayment: unknown = null
  let rawPaymentError: string | null = null
  try {
    const resp = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
    )
    rawPayment = await resp.json()
  } catch (e) {
    rawPaymentError = String(e)
  }

  // 4) Raw fetch de refunds (sin SDK)
  let rawRefunds: unknown = null
  let rawRefundsError: string | null = null
  try {
    const resp = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
      { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
    )
    rawRefunds = await resp.json()
  } catch (e) {
    rawRefundsError = String(e)
  }

  return NextResponse.json({
    sdk: {
      error: sdkError,
      id: sdkData?.id,
      status: sdkData?.status,
      status_detail: sdkData?.status_detail,
      transaction_amount: sdkData?.transaction_amount,
      transaction_amount_refunded: sdkData?.transaction_amount_refunded,
      refunds_in_payment: sdkData?.refunds,
      external_reference: sdkData?.external_reference,
      date_approved: sdkData?.date_approved,
      payer: sdkData?.payer,
    },
    sdk_refunds: {
      error: sdkRefundsError,
      data: sdkRefunds,
      is_array: Array.isArray(sdkRefunds),
      length: Array.isArray(sdkRefunds) ? sdkRefunds.length : null,
    },
    raw_payment: {
      error: rawPaymentError,
      data: rawPayment,
    },
    raw_refunds: {
      error: rawRefundsError,
      data: rawRefunds,
      is_array: Array.isArray(rawRefunds),
      length: Array.isArray(rawRefunds) ? (rawRefunds as unknown[]).length : null,
    },
  })
}
