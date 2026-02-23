import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { logRegistro } from "@/lib/activityLog"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
      },
    })

    // Registrar actividad
    await logRegistro({ id: user.id, email: user.email, name: user.name })

    // Vincular trámites existentes con este email
    const tramitesActualizados = await prisma.tramite.updateMany({
      where: {
        guestEmail: email,
        userId: null,
      },
      data: {
        userId: user.id,
        guestEmail: null,
      },
    })

    // También actualizar los pagos asociados
    if (tramitesActualizados.count > 0) {
      await prisma.pago.updateMany({
        where: {
          tramite: {
            userId: user.id,
          },
          userId: null,
        },
        data: {
          userId: user.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tramitesVinculados: tramitesActualizados.count,
    })
  } catch (error) {
    console.error("Error al registrar usuario:", error)
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    )
  }
}
