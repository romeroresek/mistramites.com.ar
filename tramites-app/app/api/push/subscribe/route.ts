import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Datos de suscripcion invalidos" },
        { status: 400 }
      )
    }

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: user.id,
      },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Suscripcion guardada exitosamente",
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error("Error al guardar suscripcion:", error)
    return NextResponse.json(
      { error: "Error al guardar suscripcion" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint requerido" },
        { status: 400 }
      )
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    })

    return NextResponse.json({
      success: true,
      message: "Suscripcion eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar suscripcion:", error)
    return NextResponse.json(
      { error: "Error al eliminar suscripcion" },
      { status: 500 }
    )
  }
}
