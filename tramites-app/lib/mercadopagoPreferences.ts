import { prisma } from "@/lib/prisma"
import {
  getMercadoPagoPreferenceUrl,
  type MercadoPagoBackUrls,
} from "@/lib/mercadopago"

interface EnsureMercadoPagoPreferenceParams {
  tramiteId: string
  title: string
  amount: number
  userId: string | null
  payerEmail?: string
  payerName?: string
  backUrls: MercadoPagoBackUrls
  notificationUrl?: string | null
  autoReturnApproved?: boolean
  existingPreferenceId?: string | null
  canReuseExistingPreference?: boolean
}

export interface MercadoPagoPreferenceResult {
  preferenceId: string
  initPoint: string
  reusedExistingPreference: boolean
  createdPreference: boolean
}

interface MercadoPagoPreferenceResponse {
  id?: string
  init_point?: string
}

export async function ensureMercadoPagoPreference({
  tramiteId,
  title,
  amount,
  userId,
  payerEmail,
  payerName,
  backUrls,
  notificationUrl,
  autoReturnApproved = false,
  existingPreferenceId,
  canReuseExistingPreference = false,
}: EnsureMercadoPagoPreferenceParams): Promise<MercadoPagoPreferenceResult> {
  if (canReuseExistingPreference && existingPreferenceId) {
    return {
      preferenceId: existingPreferenceId,
      initPoint: getMercadoPagoPreferenceUrl(existingPreferenceId),
      reusedExistingPreference: true,
      createdPreference: false,
    }
  }

  const preferenceBody: Record<string, unknown> = {
    items: [
      {
        id: tramiteId,
        title,
        quantity: 1,
        unit_price: amount,
        currency_id: "ARS",
      },
    ],
    payer: {
      email: payerEmail,
      name: payerName,
    },
    external_reference: tramiteId,
    back_urls: backUrls,
  }

  if (autoReturnApproved) {
    preferenceBody.auto_return = "approved"
  }

  if (notificationUrl) {
    preferenceBody.notification_url = notificationUrl
  }

  const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(preferenceBody),
  })

  const result = (await mpResponse.json()) as MercadoPagoPreferenceResponse

  if (!mpResponse.ok || typeof result.id !== "string") {
    throw new Error("Error al crear preferencia de pago")
  }

  if (existingPreferenceId !== result.id) {
    await prisma.pago.upsert({
      where: { tramiteId },
      update: { mercadopagoId: result.id },
      create: {
        tramiteId,
        userId,
        monto: amount,
        estado: "pendiente",
        mercadopagoId: result.id,
      },
    })
  }

  return {
    preferenceId: result.id,
    initPoint:
      typeof result.init_point === "string"
        ? result.init_point
        : getMercadoPagoPreferenceUrl(result.id),
    reusedExistingPreference: false,
    createdPreference: true,
  }
}
