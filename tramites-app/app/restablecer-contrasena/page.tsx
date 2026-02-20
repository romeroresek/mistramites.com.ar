"use client"

import Link from "next/link"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useState } from "react"

function ResetContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-3 sm:px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded border border-gray-200 p-6 text-center">
                        <p className="text-red-600 text-sm mb-4">El enlace es inválido o ha expirado.</p>
                        <Link href="/recuperar-contrasena" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Solicitar un nuevo enlace
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden")
            return
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Error al restablecer la contraseña")
                return
            }

            setSuccess(true)
            setTimeout(() => {
                router.push("/login")
            }, 2000)
        } catch {
            setError("Error al restablecer la contraseña")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-3 sm:px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-6">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <Image src="/icon-192x192.png" alt="Trámites Misiones" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10" />
                        <span className="text-xl sm:text-2xl font-semibold text-gray-800">Trámites Misiones</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded border border-gray-200">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">Nueva contraseña</h1>
                    </div>

                    <div className="p-4 sm:p-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs sm:text-sm mb-4">
                                {error}
                            </div>
                        )}

                        {success ? (
                            <div>
                                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-xs sm:text-sm mb-4">
                                    Contraseña actualizada exitosamente. Redirigiendo al login...
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 text-xs sm:text-sm text-center mb-6">
                                    Ingresá tu nueva contraseña.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                            Nueva contraseña
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirmar contraseña
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Repetí tu contraseña"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? "Actualizando..." : "Actualizar contraseña"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>

                {/* Volver al inicio */}
                <div className="text-center mt-6">
                    <Link href="/login" className="text-blue-600 hover:text-blue-700 text-sm">
                        ← Volver al login
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-xs sm:text-sm mt-4">
                    © 2024 Trámites Misiones - Todos los derechos reservados
                </p>
            </div>
        </div>
    )
}

export default function RestablecerContrasenaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-gray-600">Cargando...</div>
            </div>
        }>
            <ResetContent />
        </Suspense>
    )
}
