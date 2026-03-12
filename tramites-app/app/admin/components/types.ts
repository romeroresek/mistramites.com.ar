export interface Plantilla {
  id: string
  clave: string
  nombre: string
  mensaje: string
  activo: boolean
}

export interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  observaciones: string | null
  user: { name: string; email: string } | null
  guestEmail: string | null
  whatsapp: string | null
  monto: number
  createdAt: string
  archivoUrl: string | null
  pago?: {
    estado: string
    mercadopagoId: string | null
    paymentId: string | null
    payerEmail: string | null
    payerName: string | null
    payerDni: string | null
    paymentMethod: string | null
    paymentDate: string | null
  }
  partida?: {
    tipoPartida: string
    nombres: string
    apellido: string
    dni: string | null
    sexo: string | null
    fechaNacimiento: string | null
    ciudadNacimiento: string | null
    whatsapp: string | null
  }
}

export type AdminTramitesFilter = "pendiente" | "en_proceso" | null

export interface AdminTramitesPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminTramitesStats {
  pendientesCount: number
  enProcesoCount: number
}

export interface AdminTramitesResponse {
  data: Tramite[]
  pagination: AdminTramitesPagination
  stats: AdminTramitesStats
}

export const MP_VERIFY_BATCH_SIZE = 20

export const normalizeEstado = (estado: string | null | undefined): string =>
  (estado ?? "").trim().toLowerCase().replace(/\s+/g, "_")

export const isPendienteParaProcesar = (tramite: Tramite): boolean =>
  normalizeEstado(tramite.estado) === "pendiente" && tramite.pago?.estado === "confirmado"

export const isEnProceso = (tramite: Tramite): boolean => {
  const normalizedEstado = normalizeEstado(tramite.estado)
  return normalizedEstado === "en_proceso" || normalizedEstado === "en_curso"
}

export const matchesAdminFilter = (
  tramite: Tramite,
  filterStatus: AdminTramitesFilter
): boolean => {
  if (filterStatus === "pendiente") return isPendienteParaProcesar(tramite)
  if (filterStatus === "en_proceso") return isEnProceso(tramite)
  return true
}

export const tieneLinkPago = (tramite: Tramite): boolean =>
  !!(tramite.pago?.estado === "pendiente" && tramite.pago?.mercadopagoId)

export const getLinkPagoUrl = (tramite: Tramite): string =>
  tieneLinkPago(tramite) && tramite.pago?.mercadopagoId
    ? `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${tramite.pago.mercadopagoId}`
    : ""

export const getWhatsappNumber = (tramite: Tramite): string | null =>
  tramite.whatsapp || tramite.partida?.whatsapp || null
