import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { userTramiteDetailSelect } from "@/lib/tramiteSelects"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const tramite = await prisma.tramite.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          { guestEmail: session.user.email },
        ],
      },
      select: userTramiteDetailSelect,
    })

    if (!tramite) {
      return NextResponse.json({ error: "Trámite no encontrado" }, { status: 404 })
    }

    logTrafficMetric({
      route: "/api/tramites/[id]",
      operation: "user_tramite_detail",
      rowCount: 1,
      payloadBytes: estimateJsonPayloadBytes(tramite),
      extra: { tramiteId: id },
    })

    return NextResponse.json(tramite)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener el trámite" }, { status: 500 })
  }
}
