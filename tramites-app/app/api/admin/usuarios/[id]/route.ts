import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// PUT: actualizar usuario
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, role, whatsapp } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 })
    }

    // Verificar que el usuario existe
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar que el email no esté en uso por otro usuario
    if (email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } })
      if (emailTaken) {
        return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
      }
    }

    const data: Record<string, unknown> = { name, email, role }
    if (whatsapp !== undefined) data.whatsapp = whatsapp || null
    if (password && password.length >= 6) {
      data.password = await bcrypt.hash(password, 10)
    }

    let usuario
    try {
      usuario = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true, role: true, whatsapp: true, createdAt: true },
      })
    } catch {
      delete data.whatsapp
      usuario = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}
