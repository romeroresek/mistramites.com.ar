import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../auth/[...nextauth]/route"

const prisma = new PrismaClient()

// GET: obtener todos los trámites del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const tramites = await prisma.tramite.findMany({
      where: { userId: user.id },
      include: {
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

// POST: crear nuevo trámite
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { oficina, tipoTramite, descripcion, monto } = body

    if (!oficina || !tipoTramite || !monto) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const tramite = await prisma.tramite.create({
      data: {
        userId: user.id,
        oficina,
        tipoTramite,
        descripcion: descripcion || "",
        monto,
        estado: "pendiente",
      },
      include: {
        documentos: true,
        pago: true,
      },
    })

    // Crear pago asociado
    await prisma.pago.create({
      data: {
        tramiteId: tramite.id,
        userId: user.id,
        monto,
        estado: "pendiente",
      },
    })

    return NextResponse.json(tramite, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear trámite" }, { status: 500 })
  }
}
