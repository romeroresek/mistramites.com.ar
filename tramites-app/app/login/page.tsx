"use client"

import { signIn, getSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Suspense, useState } from "react"
import { Chrome } from "lucide-react"

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const getRedirectUrl = async () => {
    if (callbackUrl) return callbackUrl
    const session = await getSession()
    if (session?.user?.role === "admin") {
      return "/admin"
    }
    return "/mis-tramites"
  }

  const handleGoogleLogin = async () => {
    // Para Google, usar página intermedia que redirige según rol
    signIn("google", { callbackUrl: callbackUrl || "/auth/redirect" })
  }

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setFormError("Email o contraseña incorrectos")
      } else {
        const redirectUrl = await getRedirectUrl()
        router.push(redirectUrl)
      }
    } catch {
      setFormError("Error al iniciar sesión")
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
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">Iniciar sesion</h1>
          </div>

          <div className="p-4 sm:p-6">
            {(error || formError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs sm:text-sm mb-4">
                {formError || "Error al iniciar sesion. Por favor intenta de nuevo."}
              </div>
            )}

            <p className="text-gray-600 text-xs sm:text-sm text-center mb-6">
              Accede a tu cuenta para gestionar tus tramites
            </p>

            {/* Formulario de email/contraseña */}
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <div className="mt-1 text-right">
                  <Link href="/recuperar-contrasena" className="text-xs text-blue-600 hover:text-blue-700">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Iniciando sesion..." : "Iniciar sesion"}
              </button>
            </form>

            {/* Separador */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">o continua con</span>
              </div>
            </div>

            {/* Botón de Google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
            >
              <Chrome className="w-5 h-5" />
              Google
            </button>

            {/* Link a registro */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                ¿No tenes cuenta?{" "}
                <Link href="/registro" className="text-blue-600 hover:text-blue-700 font-medium">
                  Registrate
                </Link>
              </p>
            </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
