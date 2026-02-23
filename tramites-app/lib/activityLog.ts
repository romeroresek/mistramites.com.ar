import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

// Tipos de actividad
export const ActivityType = {
  // Autenticación
  LOGIN: "LOGIN",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  REGISTRO: "REGISTRO",
  PASSWORD_RESET_REQUEST: "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET_COMPLETE: "PASSWORD_RESET_COMPLETE",

  // Trámites
  TRAMITE_CREADO: "TRAMITE_CREADO",
  TRAMITE_ACTUALIZADO: "TRAMITE_ACTUALIZADO",
  ESTADO_CAMBIO: "ESTADO_CAMBIO",
  ARCHIVO_SUBIDO: "ARCHIVO_SUBIDO",
  ARCHIVO_DESCARGADO: "ARCHIVO_DESCARGADO",

  // Pagos
  PAGO_INICIADO: "PAGO_INICIADO",
  PAGO_CONFIRMADO: "PAGO_CONFIRMADO",
  PAGO_FALLIDO: "PAGO_FALLIDO",
  PAGO_REEMBOLSADO: "PAGO_REEMBOLSADO",

  // Admin
  ADMIN_LOGIN: "ADMIN_LOGIN",
  ADMIN_TRAMITE_EDITADO: "ADMIN_TRAMITE_EDITADO",
  ADMIN_ESTADO_CAMBIADO: "ADMIN_ESTADO_CAMBIADO",
  ADMIN_ARCHIVO_SUBIDO: "ADMIN_ARCHIVO_SUBIDO",
  ADMIN_PLANTILLA_EDITADA: "ADMIN_PLANTILLA_EDITADA",
  ADMIN_WHATSAPP_ENVIADO: "ADMIN_WHATSAPP_ENVIADO",

  // Otros
  PERFIL_ACTUALIZADO: "PERFIL_ACTUALIZADO",
  NOTIFICACIONES_ACTIVADAS: "NOTIFICACIONES_ACTIVADAS",
  NOTIFICACIONES_DESACTIVADAS: "NOTIFICACIONES_DESACTIVADAS",
} as const

export type ActivityTypeKey = keyof typeof ActivityType

export interface LogActivityParams {
  tipo: string
  accion: string
  userId?: string | null
  userEmail?: string | null
  userName?: string | null
  tramiteId?: string | null
  metadata?: Record<string, unknown>
  ip?: string | null
  userAgent?: string | null
}

/**
 * Registra una actividad en el sistema
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    // Intentar obtener IP y User-Agent de headers si no se proporcionan
    let ip = params.ip
    let userAgent = params.userAgent

    if (!ip || !userAgent) {
      try {
        const headersList = await headers()
        if (!ip) {
          ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               headersList.get("x-real-ip") ||
               null
        }
        if (!userAgent) {
          userAgent = headersList.get("user-agent") || null
        }
      } catch {
        // Headers no disponibles (ej: en contexto de servidor sin request)
      }
    }

    await prisma.activityLog.create({
      data: {
        tipo: params.tipo,
        accion: params.accion,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        userName: params.userName || null,
        tramiteId: params.tramiteId || null,
        ip: ip || null,
        userAgent: userAgent || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    })
  } catch (error) {
    // No lanzar error para no interrumpir el flujo principal
    console.error("Error al registrar actividad:", error)
  }
}

/**
 * Helper para loguear login exitoso
 */
export async function logLogin(user: { id: string; email?: string | null; name?: string | null }) {
  await logActivity({
    tipo: ActivityType.LOGIN,
    accion: `Inicio de sesión: ${user.email || "usuario"}`,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
  })
}

/**
 * Helper para loguear login fallido
 */
export async function logLoginFailed(email: string, reason?: string) {
  await logActivity({
    tipo: ActivityType.LOGIN_FAILED,
    accion: `Intento de login fallido: ${email}`,
    userEmail: email,
    metadata: reason ? { reason } : undefined,
  })
}

/**
 * Helper para loguear registro
 */
export async function logRegistro(user: { id: string; email?: string | null; name?: string | null }) {
  await logActivity({
    tipo: ActivityType.REGISTRO,
    accion: `Nuevo registro: ${user.email || "usuario"}`,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
  })
}

/**
 * Helper para loguear cambio de estado de trámite
 */
export async function logEstadoCambio(params: {
  tramiteId: string
  estadoAnterior: string
  estadoNuevo: string
  userId?: string | null
  userEmail?: string | null
  userName?: string | null
  isAdmin?: boolean
}) {
  const tipo = params.isAdmin ? ActivityType.ADMIN_ESTADO_CAMBIADO : ActivityType.ESTADO_CAMBIO
  await logActivity({
    tipo,
    accion: `Estado cambiado de "${params.estadoAnterior}" a "${params.estadoNuevo}"`,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    tramiteId: params.tramiteId,
    metadata: {
      estadoAnterior: params.estadoAnterior,
      estadoNuevo: params.estadoNuevo,
    },
  })
}

/**
 * Helper para loguear pago
 */
export async function logPago(params: {
  tipo: "iniciado" | "confirmado" | "fallido" | "reembolsado"
  tramiteId: string
  monto: number
  userId?: string | null
  userEmail?: string | null
  paymentId?: string | null
  metadata?: Record<string, unknown>
}) {
  const tipoMap = {
    iniciado: ActivityType.PAGO_INICIADO,
    confirmado: ActivityType.PAGO_CONFIRMADO,
    fallido: ActivityType.PAGO_FALLIDO,
    reembolsado: ActivityType.PAGO_REEMBOLSADO,
  }

  const accionMap = {
    iniciado: `Pago iniciado por $${params.monto.toLocaleString("es-AR")}`,
    confirmado: `Pago confirmado por $${params.monto.toLocaleString("es-AR")}`,
    fallido: `Pago fallido por $${params.monto.toLocaleString("es-AR")}`,
    reembolsado: `Pago reembolsado por $${params.monto.toLocaleString("es-AR")}`,
  }

  await logActivity({
    tipo: tipoMap[params.tipo],
    accion: accionMap[params.tipo],
    userId: params.userId,
    userEmail: params.userEmail,
    tramiteId: params.tramiteId,
    metadata: {
      monto: params.monto,
      paymentId: params.paymentId,
      ...params.metadata,
    },
  })
}

/**
 * Helper para loguear creación de trámite
 */
export async function logTramiteCreado(params: {
  tramiteId: string
  tipoTramite: string
  userId?: string | null
  userEmail?: string | null
  userName?: string | null
  monto: number
}) {
  await logActivity({
    tipo: ActivityType.TRAMITE_CREADO,
    accion: `Trámite creado: ${params.tipoTramite}`,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    tramiteId: params.tramiteId,
    metadata: {
      tipoTramite: params.tipoTramite,
      monto: params.monto,
    },
  })
}
