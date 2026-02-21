// Plantillas de mensajes para contactar usuarios por WhatsApp

export interface TemplateParams {
  nombre: string
  tipo: string
  monto?: number
  linkPago?: string
}

export const templates = {
  tramiteListo: {
    id: "tramiteListo",
    nombre: "Trámite listo",
    mensaje: ({ nombre, tipo }: TemplateParams) =>
      `Hola ${nombre}! Tu ${tipo} ya está lista para descargar. Ingresá a tu cuenta en mistramites.com.ar para obtenerla.`,
  },
  enProceso: {
    id: "enProceso",
    nombre: "En proceso",
    mensaje: ({ nombre, tipo }: TemplateParams) =>
      `Hola ${nombre}! Tu solicitud de ${tipo} está siendo procesada. Te avisaremos cuando esté lista.`,
  },
  requiereInfo: {
    id: "requiereInfo",
    nombre: "Requiere información",
    mensaje: ({ nombre }: TemplateParams) =>
      `Hola ${nombre}! Necesitamos información adicional para procesar tu trámite. Por favor respondé este mensaje.`,
  },
  recordatorioPago: {
    id: "recordatorioPago",
    nombre: "Recordatorio de pago",
    mensaje: ({ nombre, tipo, monto, linkPago }: TemplateParams) =>
      `Hola ${nombre}! Te recordamos que tu solicitud de ${tipo} tiene un pago pendiente de $${(monto || 0).toLocaleString("es-AR")}.${linkPago ? ` Podés pagarlo desde acá: ${linkPago}` : " Ingresá a mistramites.com.ar para completarlo."}`,
  },
  rechazo: {
    id: "rechazo",
    nombre: "Problema/Rechazo",
    mensaje: ({ nombre, tipo }: TemplateParams) =>
      `Hola ${nombre}! Lamentamos informarte que hubo un problema con tu solicitud de ${tipo}. Por favor contactanos para más información.`,
  },
  confirmacionRecepcion: {
    id: "confirmacionRecepcion",
    nombre: "Confirmación de recepción",
    mensaje: ({ nombre, tipo }: TemplateParams) =>
      `Hola ${nombre}! Confirmamos que recibimos tu solicitud de ${tipo}. Te notificaremos cuando tengamos novedades.`,
  },
} as const

export type TemplateKey = keyof typeof templates

// Generar link de WhatsApp Business — usa api.whatsapp.com que abre WA Business si está instalado
export const generateWhatsAppLink = (phone: string, message: string): string => {
  // Limpiar número (solo dígitos)
  const cleanPhone = phone.replace(/\D/g, "")
  // Agregar código de Argentina si no está
  const phoneWithCode = cleanPhone.startsWith("54")
    ? cleanPhone
    : `54${cleanPhone}`
  return `https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(message)}`
}

// Lista de plantillas para dropdown
export const templateList = Object.values(templates)
