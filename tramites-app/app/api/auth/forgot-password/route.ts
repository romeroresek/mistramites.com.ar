import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json(
                { error: "El email es requerido" },
                { status: 400 }
            )
        }

        // Buscar usuario con contraseña (no OAuth-only)
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, password: true },
        })

        // Siempre responder con éxito para no revelar si el email existe
        if (!user || !user.password) {
            return NextResponse.json({
                success: true,
                message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña.",
            })
        }

        // Eliminar tokens previos de este email
        await prisma.passwordResetToken.deleteMany({
            where: { email },
        })

        // Generar nuevo token con expiración de 1 hora
        const token = randomUUID()
        const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expires,
            },
        })

        // Enviar email
        await sendPasswordResetEmail(email, token)

        return NextResponse.json({
            success: true,
            message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña.",
        })
    } catch (error) {
        console.error("Error en forgot-password:", error)
        return NextResponse.json(
            { error: "Error al procesar la solicitud" },
            { status: 500 }
        )
    }
}
