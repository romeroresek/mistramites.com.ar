export interface MercadoPagoBackUrls {
  success: string
  failure: string
  pending: string
}

export function getMercadoPagoPreferenceUrl(preferenceId: string): string {
  return `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${encodeURIComponent(preferenceId)}`
}

export function getPagoExitosoBackUrls(
  baseUrl: string,
  tramiteId: string
): MercadoPagoBackUrls {
  return {
    success: `${baseUrl}/pago-exitoso?tramiteId=${tramiteId}`,
    failure: `${baseUrl}/pago-exitoso?tramiteId=${tramiteId}&status=failure`,
    pending: `${baseUrl}/pago-exitoso?tramiteId=${tramiteId}&status=pending`,
  }
}

export function getMisTramitesBackUrls(baseUrl: string): MercadoPagoBackUrls {
  return {
    success: `${baseUrl}/mis-tramites`,
    failure: `${baseUrl}/mis-tramites`,
    pending: `${baseUrl}/mis-tramites`,
  }
}

export function getMercadoPagoWebhookUrl(webhookBaseUrl?: string | null): string | null {
  if (!webhookBaseUrl) return null
  return `${webhookBaseUrl}/api/mercadopago/webhook`
}
