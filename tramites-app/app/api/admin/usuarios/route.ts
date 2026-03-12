import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"

// GET: listar todos los usuarios
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get("page")
    const limitParam = searchParams.get("limit")
    const search = searchParams.get("search")?.trim()
    const isPaginated = pageParam !== null || limitParam !== null || Boolean(search)

    const baseSelect = {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { tramites: true } as const },
    } as const

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { role: { contains: search, mode: "insensitive" as const } },
            { whatsapp: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined

    let usuarios: Array<Record<string, unknown>>

    if (isPaginated) {
      const page = Math.max(1, parseInt(pageParam || "1", 10) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || "25", 10) || 25))
      const skip = (page - 1) * limit

      let response: {
        data: Array<Record<string, unknown>>
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }

      try {
        const [data, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: { ...baseSelect, whatsapp: true },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.user.count({ where }),
        ])

        response = {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        }
      } catch {
        const [data, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: baseSelect,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }) as Promise<Array<Record<string, unknown>>>,
          prisma.user.count({ where }),
        ])

        response = {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        }
      }

      logTrafficMetric({
        route: "/api/admin/usuarios",
        operation: "admin_users_list_paginated",
        rowCount: response.data.length,
        payloadBytes: estimateJsonPayloadBytes(response),
        extra: {
          page,
          limit,
          search: search || null,
          total: response.pagination.total,
        },
      })

      return NextResponse.json(response)
    }

    try {
      usuarios = await prisma.user.findMany({
        where,
        select: { ...baseSelect, whatsapp: true },
        orderBy: { createdAt: "desc" },
      })
    } catch {
      usuarios = await prisma.user.findMany({
        where,
        select: baseSelect,
        orderBy: { createdAt: "desc" },
      }) as Array<Record<string, unknown>>
    }

    logTrafficMetric({
      route: "/api/admin/usuarios",
      operation: "admin_users_list_full",
      rowCount: usuarios.length,
      payloadBytes: estimateJsonPayloadBytes(usuarios),
      extra: { search: search || null },
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

// POST: crear nuevo usuario
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { email, name, password, role, whatsapp } = body

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    const baseData = { email, name, password: hashedPassword, role: role || "usuario" }
    let usuario
    try {
      usuario = await prisma.user.create({
        data: { ...baseData, ...(whatsapp !== undefined && { whatsapp: whatsapp || null }) },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      })
    } catch {
      usuario = await prisma.user.create({
        data: baseData,
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      })
    }

    return NextResponse.json(usuario, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}
