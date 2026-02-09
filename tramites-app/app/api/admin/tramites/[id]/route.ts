import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { notifyTramiteStatusChange } from "@/lib/tramiteNotifications"

const prisma = new PrismaClient()

// GET: obtener detalles de un trámite
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
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const tramite = await prisma.tramite.findUnique({
      where: { id },
      include: {
        user: true,
        documentos: true,
        pago: true,
        partida: true,
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

// PUT: actualizar trámite (estado, monto, estado de pago)
export async function PUT(
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
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { estado, monto, pagoEstado } = body

    // Actualizar trámite
    const tramiteData: Record<string, unknown> = {}
    if (estado) tramiteData.estado = estado
    if (monto !== undefined) tramiteData.monto = parseFloat(monto)

    const tramite = await prisma.tramite.update({
      where: { id },
      data: tramiteData,
      include: {
        user: true,
        documentos: true,
        pago: true,
        partida: true,
      },
    })

    // Actualizar estado de pago si se proporciona
    if (pagoEstado && tramite.pago) {
      await prisma.pago.update({
        where: { id: tramite.pago.id },
        data: { estado: pagoEstado },
      })
    }

    // Obtener trámite actualizado
    const tramiteActualizado = await prisma.tramite.findUnique({
      where: { id },
      include: {
        user: true,
        documentos: true,
        pago: true,
        partida: true,
      },
    })

    // Enviar notificacion push si cambio el estado
    if (estado && tramiteActualizado) {
      notifyTramiteStatusChange(id, estado, tramiteActualizado.userId).catch(
        (err) => console.error("Error al enviar notificacion:", err)
      )
    }

    return NextResponse.json(tramiteActualizado)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al actualizar trámite" }, { status: 500 })
  }
}

// DELETE: eliminar trámite
export async function DELETE(
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
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Eliminar trámite (cascade eliminará documentos, pago y partida)
    await prisma.tramite.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Trámite eliminado" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al eliminar trámite" }, { status: 500 })
  }
}
