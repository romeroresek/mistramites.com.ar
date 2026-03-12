import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50))
    const tipo = searchParams.get("tipo") || undefined
    const search = searchParams.get("search") || undefined
    const desde = searchParams.get("desde") || undefined
    const hasta = searchParams.get("hasta") || undefined

    const skip = (page - 1) * limit

    // Construir filtros
    const where: Record<string, unknown> = {}

    if (tipo) {
      where.tipo = tipo
    }

    if (search) {
      where.OR = [
        { accion: { contains: search, mode: "insensitive" } },
        { userEmail: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
        { tramiteId: { contains: search, mode: "insensitive" } },
      ]
    }

    if (desde || hasta) {
      where.createdAt = {}
      if (desde) {
        (where.createdAt as Record<string, Date>).gte = new Date(desde)
      }
      if (hasta) {
        const hastaDate = new Date(hasta)
        hastaDate.setHours(23, 59, 59, 999)
        ;(where.createdAt as Record<string, Date>).lte = hastaDate
      }
    }

    // Obtener logs con paginación
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        select: {
          id: true,
          tipo: true,
          accion: true,
          userEmail: true,
          userName: true,
          tramiteId: true,
          ip: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ])

    // Obtener tipos únicos para el filtro
    const tipos = await prisma.activityLog.groupBy({
      by: ["tipo"],
      _count: { tipo: true },
      orderBy: { _count: { tipo: "desc" } },
    })

    const response = {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      tipos: tipos.map((t) => ({ tipo: t.tipo, count: t._count.tipo })),
    }

    logTrafficMetric({
      route: "/api/admin/logs",
      operation: "admin_logs_list",
      rowCount: logs.length,
      payloadBytes: estimateJsonPayloadBytes(response),
      extra: {
        page,
        limit,
        tipo: tipo || null,
        search: search || null,
        desde: desde || null,
        hasta: hasta || null,
        total,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error al obtener logs:", error)
    return NextResponse.json({ error: "Error al obtener logs" }, { status: 500 })
  }
}
