import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { userTramiteDetailSelect } from "@/lib/tramiteSelects"
import { estimateJsonPayloadBytes, logTrafficMetric } from "@/lib/trafficMetrics"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const ownerFilters: Array<{ userId: string } | { guestEmail: string }> = [
      { guestEmail: session.user.email },
    ]
    if (session.user.id) {
      ownerFilters.unshift({ userId: session.user.id })
    }

    const tramite = await prisma.tramite.findFirst({
      where: {
        id,
        OR: ownerFilters,
      },
      select: userTramiteDetailSelect,
    })

    if (!tramite) {
      return NextResponse.json({ error: "Tramite no encontrado" }, { status: 404 })
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
    return NextResponse.json({ error: "Error al obtener el tramite" }, { status: 500 })
  }
}
