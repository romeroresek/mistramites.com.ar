"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

export default function RecuperarContrasenaPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Error al procesar la solicitud")
                return
            }

            setSent(true)
        } catch {
            setError("Error al procesar la solicitud")
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
                        <Image src="/icon-192x192.png" alt="Trámites Misiones" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10" style={{ maxWidth: 40, maxHeight: 40 }} priority />
                        <span className="text-xl sm:text-2xl font-semibold text-gray-800">Trámites Misiones</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded border border-gray-200">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">Recuperar contraseña</h1>
                    </div>

                    <div className="p-4 sm:p-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs sm:text-sm mb-4">
                                {error}
                            </div>
                        )}

                        {sent ? (
                            <div>
                                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-xs sm:text-sm mb-4">
                                    Si el email está registrado, recibirás un enlace para restablecer tu contraseña. Revisá tu bandeja de entrada y la carpeta de spam.
                                </div>
                                <div className="text-center mt-4">
                                    <Link href="/login" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                        Volver a Iniciar sesión
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 text-xs sm:text-sm text-center mb-6">
                                    Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="tu@email.com"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                                    </button>
                                </form>

                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600 text-center">
                                        ¿Recordaste tu contraseña?{" "}
                                        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                            Iniciar sesión
                                        </Link>
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Volver al inicio */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">
                        ← Volver al inicio
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
