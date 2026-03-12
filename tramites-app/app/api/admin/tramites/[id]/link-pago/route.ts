import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET: Obtiene el link de pago de MercadoPago para un trámite.
 * Usa el redirect determinístico por preference id para evitar roundtrips extra a MP.
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
      select: { role: true },
    })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const tramite = await prisma.tramite.findUnique({
      where: { id: tramiteId },
      select: {
        pago: {
          select: {
            mercadopagoId: true,
          },
        },
      },
    })

    if (!tramite?.pago?.mercadopagoId) {
      return NextResponse.json({ error: "No hay preferencia de pago" }, { status: 404 })
    }

    const initPoint = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${tramite.pago.mercadopagoId}`

    return NextResponse.json({ initPoint })
  } catch (error) {
    console.error("Error obteniendo link de pago:", error)
    return NextResponse.json(
      { error: "Error al obtener el link de pago" },
      { status: 500 }
    )
  }
}
