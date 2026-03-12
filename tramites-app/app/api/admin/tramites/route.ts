import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { Prisma } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { adminTramiteListSelect } from "@/lib/tramiteSelects"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"

// GET: listar trámites con paginación y búsqueda opcional
// Query params: page (1-based), limit (default 50), search (text)
// Sin params de paginación devuelve todo (backward compat)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get("page")
    const limitParam = searchParams.get("limit")
    const search = searchParams.get("search")?.trim()
    const filterStatus = searchParams.get("filterStatus")

    const isPaginated = pageParam !== null || limitParam !== null

    const searchWhere: Prisma.TramiteWhereInput | undefined = search
      ? {
          OR: [
            { tipoTramite: { contains: search, mode: "insensitive" } },
            { guestEmail: { contains: search, mode: "insensitive" } },
            { whatsapp: { contains: search, mode: "insensitive" } },
            { observaciones: { contains: search, mode: "insensitive" } },
            { user: { is: { name: { contains: search, mode: "insensitive" } } } },
            { user: { is: { email: { contains: search, mode: "insensitive" } } } },
            { partida: { is: { nombres: { contains: search, mode: "insensitive" } } } },
            { partida: { is: { apellido: { contains: search, mode: "insensitive" } } } },
            { partida: { is: { dni: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : undefined

    const statusWhere: Prisma.TramiteWhereInput | undefined =
      filterStatus === "pendiente"
        ? {
            estado: "pendiente",
            pago: {
              is: {
                estado: "confirmado",
              },
            },
          }
        : filterStatus === "en_proceso"
          ? {
              OR: [
                { estado: "en_proceso" },
                { estado: "en_curso" },
              ],
            }
          : undefined

    const combineWhere = (
      ...clauses: Array<Prisma.TramiteWhereInput | undefined>
    ): Prisma.TramiteWhereInput | undefined => {
      const validClauses = clauses.filter(
        (clause): clause is Prisma.TramiteWhereInput => Boolean(clause)
      )

      if (validClauses.length === 0) return undefined
      if (validClauses.length === 1) return validClauses[0]

      return {
        AND: validClauses,
      }
    }

    const where = combineWhere(searchWhere, statusWhere)
    const pendientesWhere = combineWhere(searchWhere, {
      estado: "pendiente",
      pago: {
        is: {
          estado: "confirmado",
        },
      },
    })
    const enProcesoWhere = combineWhere(searchWhere, {
      OR: [
        { estado: "en_proceso" },
        { estado: "en_curso" },
      ],
    })

    if (isPaginated) {
      const page = Math.max(1, parseInt(pageParam || "1", 10) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || "50", 10) || 50))
      const skip = (page - 1) * limit

      const [tramites, total, pendientesCount, enProcesoCount] = await Promise.all([
        prisma.tramite.findMany({
          where,
          select: adminTramiteListSelect,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.tramite.count({ where }),
        prisma.tramite.count({ where: pendientesWhere }),
        prisma.tramite.count({ where: enProcesoWhere }),
      ])

      const response = {
        data: tramites,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          pendientesCount,
          enProcesoCount,
        },
      }

      logTrafficMetric({
        route: "/api/admin/tramites",
        operation: "admin_tramites_list_paginated",
        rowCount: tramites.length,
        payloadBytes: estimateJsonPayloadBytes(response),
        extra: {
          page,
          limit,
          search: search || null,
          filterStatus: filterStatus || null,
          total,
        },
      })

      return NextResponse.json(response)
    }

    // Sin paginación: devolver todo (backward compat)
    const tramites = await prisma.tramite.findMany({
      where,
      select: adminTramiteListSelect,
      orderBy: { createdAt: "desc" },
    })

    logTrafficMetric({
      route: "/api/admin/tramites",
      operation: "admin_tramites_list_full",
      rowCount: tramites.length,
      payloadBytes: estimateJsonPayloadBytes(tramites),
      extra: { search: search || null },
    })

    return NextResponse.json(tramites)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener trámites" }, { status: 500 })
  }
}

// POST: crear trámite desde admin
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { userId, oficina, tipoTramite, descripcion, monto, estado, pagoEstado, partida } = body

    if (!userId || !oficina || !tipoTramite || !monto) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar que el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Crear trámite, pago y partida (si existe) en transacción
    const tramite = await prisma.$transaction(async (tx) => {
      const tramite = await tx.tramite.create({
        data: {
          userId,
          oficina,
          tipoTramite,
          descripcion: descripcion || "",
          monto,
          estado: estado || "pendiente",
        },
      })

      await tx.pago.create({
        data: {
          tramiteId: tramite.id,
          userId,
          monto,
          estado: pagoEstado || "pendiente",
        },
      })

      // Si hay datos de partida, crearla
      if (partida && partida.tipoPartida) {
        await tx.partida.create({
          data: {
            tramiteId: tramite.id,
            tipoPartida: partida.tipoPartida,
            dni: partida.dni,
            sexo: partida.sexo,
            nombres: partida.nombres,
            apellido: partida.apellido,
            fechaNacimiento: new Date(partida.fechaNacimiento),
            ciudadNacimiento: partida.ciudadNacimiento || null,
            fechaDefuncion: partida.fechaDefuncion ? new Date(partida.fechaDefuncion) : null,
            dni2: partida.dni2 || null,
            sexo2: partida.sexo2 || null,
            nombres2: partida.nombres2 || null,
            apellido2: partida.apellido2 || null,
            fechaNacimiento2: partida.fechaNacimiento2 ? new Date(partida.fechaNacimiento2) : null,
            fechaMatrimonio: partida.fechaMatrimonio ? new Date(partida.fechaMatrimonio) : null,
            ciudadMatrimonio: partida.ciudadMatrimonio || null,
            divorciados: partida.divorciados || false,
            whatsapp: partida.whatsapp || null,
          },
        })
      }

      return tramite
    })

    return NextResponse.json(tramite, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear trámite" }, { status: 500 })
  }
}
