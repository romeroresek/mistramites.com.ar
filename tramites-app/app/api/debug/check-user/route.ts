import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Forzar renderizado dinámico (no pre-renderizar durante build)
export const dynamic = 'force-dynamic'

// ENDPOINT TEMPORAL DE DIAGNÓSTICO - ELIMINAR EN PRODUCCIÓN
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    console.log("[DEBUG] Buscando usuario:", email)

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        found: false,
        message: "Usuario no encontrado en la base de datos",
      })
    }

    const hasPassword = !!user.password
    let passwordMatch = false

    if (hasPassword && password) {
      passwordMatch = await bcrypt.compare(password, user.password!)
      console.log("[DEBUG] Password en DB (hash):", user.password?.substring(0, 20) + "...")
      console.log("[DEBUG] Password match:", passwordMatch)
    }

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        hasPassword,
        passwordHashPrefix: user.password?.substring(0, 10),
      },
      passwordMatch,
    })
  } catch (error) {
    console.error("[DEBUG] Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
