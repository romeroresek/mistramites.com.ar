export interface PaymentSyncFields {
  estado: string
  paymentId: string | null
  payerEmail: string | null
  payerName: string | null
  payerDni: string | null
  paymentMethod: string | null
  paymentDate: Date | string | null
}

function normalizeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function hasPaymentStateChanged(
  current: PaymentSyncFields | null | undefined,
  next: PaymentSyncFields
): boolean {
  if (!current) return true

  return (
    current.estado !== next.estado ||
    current.paymentId !== next.paymentId ||
    current.payerEmail !== next.payerEmail ||
    current.payerName !== next.payerName ||
    current.payerDni !== next.payerDni ||
    current.paymentMethod !== next.paymentMethod ||
    normalizeDate(current.paymentDate) !== normalizeDate(next.paymentDate)
  )
}
