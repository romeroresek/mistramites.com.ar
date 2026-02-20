import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json()

        if (!token || !password) {
            return NextResponse.json(
                { error: "Token y contraseña son requeridos" },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "La contraseña debe tener al menos 6 caracteres" },
                { status: 400 }
            )
        }

        // Buscar token válido
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        })

        if (!resetToken) {
            return NextResponse.json(
                { error: "El enlace es inválido o ya fue utilizado" },
                { status: 400 }
            )
        }

        // Verificar que no haya expirado
        if (resetToken.expires < new Date()) {
            // Eliminar token expirado
            await prisma.passwordResetToken.delete({
                where: { id: resetToken.id },
            })
            return NextResponse.json(
                { error: "El enlace ha expirado. Solicitá uno nuevo." },
                { status: 400 }
            )
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 12)

        // Actualizar contraseña del usuario
        await prisma.user.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword },
        })

        // Eliminar token utilizado
        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id },
        })

        return NextResponse.json({
            success: true,
            message: "Contraseña actualizada exitosamente",
        })
    } catch (error) {
        console.error("Error en reset-password:", error)
        return NextResponse.json(
            { error: "Error al restablecer la contraseña" },
            { status: 500 }
        )
    }
}
