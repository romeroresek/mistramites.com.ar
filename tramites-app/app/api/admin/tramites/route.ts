import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

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
