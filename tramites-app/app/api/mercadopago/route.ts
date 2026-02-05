import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../auth/[...nextauth]/route"

const prisma = new PrismaClient()

// Inicializar Mercado Pago SDK
const mercadopago = require("mercadopago")
mercadopago.configurations.setAccessToken(process.env.MERCADOPAGO_ACCESS_TOKEN)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { tramiteId } = body

    if (!tramiteId) {
      return NextResponse.json({ error: "tramiteId requerido" }, { status: 400 })
    }

    // Obtener el trámite
    const tramite = await prisma.tramite.findUnique({
      where: { id: tramiteId },
      include: { user: true },
    })

    if (!tramite) {
      return NextResponse.json({ error: "Trámite no encontrado" }, { status: 404 })
    }

    // Crear preferencia en Mercado Pago
    const preference = {
      items: [
        {
          title: tramite.tipoTramite,
          quantity: 1,
          unit_price: tramite.monto,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: tramite.user.email,
        name: tramite.user.name,
      },
      notification_url: `${process.env.NEXTAUTH_URL}/api/mercadopago/webhook`,
      external_reference: tramiteId,
      auto_return: "approved",
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/pago/success`,
        failure: `${process.env.NEXTAUTH_URL}/pago/failure`,
        pending: `${process.env.NEXTAUTH_URL}/pago/pending`,
      },
    }

    const response = await mercadopago.preferences.create(preference)

    // Guardar el ID de Mercado Pago
    await prisma.pago.update({
      where: { tramiteId: tramiteId },
      data: { mercadopagoId: response.body.id },
    })

    return NextResponse.json({ preferenceId: response.body.id, initPoint: response.body.init_point })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear preferencia de pago" }, { status: 500 })
  }
}
