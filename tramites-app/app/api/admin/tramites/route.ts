import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: listar todos los trámites
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    // Verificar que sea admin
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener todos los trámites
    const tramites = await prisma.tramite.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        documentos: true,
        pago: true,
      },
      orderBy: { createdAt: "desc" },
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
