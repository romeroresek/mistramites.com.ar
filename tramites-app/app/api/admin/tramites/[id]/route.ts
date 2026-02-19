import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notifyTramiteStatusChange } from "@/lib/tramiteNotifications"
import { prisma } from "@/lib/prisma"

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
    const { estado, monto, pagoEstado, partida, guestEmail, whatsapp } = body

    // Actualizar trámite
    const tramiteData: Record<string, unknown> = {}
    if (estado) tramiteData.estado = estado
    if (monto !== undefined) tramiteData.monto = parseFloat(monto)
    if (guestEmail !== undefined) tramiteData.guestEmail = guestEmail
    if (whatsapp !== undefined) tramiteData.whatsapp = whatsapp

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

    // Actualizar partida si se proporciona
    if (partida && tramite.partida) {
      await prisma.partida.update({
        where: { id: tramite.partida.id },
        data: {
          dni: partida.dni,
          sexo: partida.sexo,
          apellido: partida.apellido,
          nombres: partida.nombres,
          fechaNacimiento: new Date(partida.fechaNacimiento),
          ciudadNacimiento: partida.ciudadNacimiento || null,
        },
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

    // Enviar notificacion push si cambio el estado (solo si hay usuario registrado)
    if (estado && tramiteActualizado && tramiteActualizado.userId) {
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
