import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET: Obtiene el link de pago de MercadoPago para un trámite.
 * Consulta la API de MP para obtener el init_point actual (siempre válido).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tramiteId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const tramite = await prisma.tramite.findUnique({
      where: { id: tramiteId },
      include: { pago: true },
    })

    if (!tramite?.pago?.mercadopagoId) {
      return NextResponse.json({ error: "No hay preferencia de pago" }, { status: 404 })
    }

    const prefId = tramite.pago.mercadopagoId
    const res = await fetch(
      `https://api.mercadopago.com/checkout/preferences/${prefId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error("MercadoPago GET preference:", res.status, err)
      return NextResponse.json(
        { error: "No se pudo obtener el link de pago" },
        { status: 502 }
      )
    }

    const body = await res.json()
    const initPoint = body.init_point || body.sandbox_init_point

    if (!initPoint) {
      return NextResponse.json(
        { error: "MercadoPago no devolvió link de pago" },
        { status: 502 }
      )
    }

    return NextResponse.json({ initPoint })
  } catch (error) {
    console.error("Error obteniendo link de pago:", error)
    return NextResponse.json(
      { error: "Error al obtener el link de pago" },
      { status: 500 }
    )
  }
}
