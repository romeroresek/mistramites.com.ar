import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

// GET: obtener detalles de un trámite
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const tramite = await prisma.tramite.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        documentos: true,
        pago: true,
      },
    })

    if (!tramite) {
      return NextResponse.json({ error: "Trámite no encontrado" }, { status: 404 })
    }

    return NextResponse.json(tramite)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener trámite" }, { status: 500 })
  }
}

// PUT: actualizar estado del trámite
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { estado } = body

    if (!estado) {
      return NextResponse.json({ error: "estado requerido" }, { status: 400 })
    }

    const tramite = await prisma.tramite.update({
      where: { id: params.id },
      data: { estado },
      include: {
        user: true,
        documentos: true,
        pago: true,
      },
    })

    return NextResponse.json(tramite)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al actualizar trámite" }, { status: 500 })
  }
}
