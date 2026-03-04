import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notifyTramiteStatusChange } from "@/lib/tramiteNotifications"
import { prisma } from "@/lib/prisma"
import { logEstadoCambio, logActivity, ActivityType } from "@/lib/activityLog"

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
    const { estado, monto, pagoEstado, partida, guestEmail, whatsapp, observaciones } = body

    // Validar monto si se proporciona
    if (monto !== undefined) {
      const montoNum = parseFloat(monto)
      if (isNaN(montoNum) || montoNum < 0) {
        return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
      }
    }

    // Obtener estado actual para comparar
    const tramiteAnterior = await prisma.tramite.findUnique({
      where: { id },
      select: { estado: true, tipoTramite: true },
    })

    // Actualizar todo en una transacción para evitar datos inconsistentes
    const tramiteActualizado = await prisma.$transaction(async (tx) => {
      const tramiteData: Record<string, unknown> = {}
      if (estado) tramiteData.estado = estado
      if (monto !== undefined) tramiteData.monto = parseFloat(monto)
      if (guestEmail !== undefined) tramiteData.guestEmail = guestEmail
      if (whatsapp !== undefined) tramiteData.whatsapp = whatsapp
      if (observaciones !== undefined) tramiteData.observaciones = observaciones

      if (Object.keys(tramiteData).length > 0) {
        await tx.tramite.update({
          where: { id },
          data: tramiteData,
        })
      }

      // Actualizar estado de pago si se proporciona
      if (pagoEstado) {
        const pago = await tx.pago.findUnique({ where: { tramiteId: id } })
        if (pago) {
          await tx.pago.update({
            where: { id: pago.id },
            data: { estado: pagoEstado },
          })
        }
      }

      // Actualizar partida si se proporciona
      if (partida) {
        const partidaExistente = await tx.partida.findUnique({ where: { tramiteId: id } })
        if (partidaExistente) {
          await tx.partida.update({
            where: { id: partidaExistente.id },
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
      }

      return tx.tramite.findUnique({
        where: { id },
        include: {
          user: true,
          pago: true,
          partida: true,
        },
      })
    })

    // Enviar notificacion push si cambio el estado (solo si hay usuario registrado)
    if (estado && tramiteActualizado && tramiteActualizado.userId) {
      notifyTramiteStatusChange(id, estado, tramiteActualizado.userId).catch(
        (err) => console.error("Error al enviar notificacion:", err)
      )
    }

    // Registrar cambio de estado si hubo
    if (estado && tramiteAnterior && tramiteAnterior.estado !== estado) {
      await logEstadoCambio({
        tramiteId: id,
        estadoAnterior: tramiteAnterior.estado,
        estadoNuevo: estado,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        isAdmin: true,
      })
    }

    // Registrar otras ediciones del admin
    const cambios: string[] = []
    if (monto !== undefined) cambios.push("monto")
    if (pagoEstado) cambios.push("estado de pago")
    if (partida) cambios.push("datos de partida")
    if (guestEmail !== undefined) cambios.push("email")
    if (whatsapp !== undefined) cambios.push("whatsapp")
    if (observaciones !== undefined) cambios.push("observaciones")

    if (cambios.length > 0 && !estado) {
      await logActivity({
        tipo: ActivityType.ADMIN_TRAMITE_EDITADO,
        accion: `Trámite editado: ${cambios.join(", ")}`,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        tramiteId: id,
        metadata: { cambios },
      })
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

    // Obtener info del trámite antes de eliminar
    const tramiteAEliminar = await prisma.tramite.findUnique({
      where: { id },
      select: { tipoTramite: true, guestEmail: true, user: { select: { email: true } } },
    })

    // Eliminar trámite (cascade eliminará documentos, pago y partida)
    await prisma.tramite.delete({
      where: { id },
    })

    // Registrar eliminación
    await logActivity({
      tipo: "ADMIN_TRAMITE_ELIMINADO",
      accion: `Trámite eliminado: ${tramiteAEliminar?.tipoTramite || "desconocido"}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      tramiteId: id,
      metadata: {
        tipoTramite: tramiteAEliminar?.tipoTramite,
        clienteEmail: tramiteAEliminar?.guestEmail || tramiteAEliminar?.user?.email,
      },
    })

    return NextResponse.json({ success: true, message: "Trámite eliminado" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al eliminar trámite" }, { status: 500 })
  }
}
