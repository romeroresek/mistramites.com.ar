"use client"

import { signOut } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Suspense, useState } from "react"

function CerrarSesionContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [loading, setLoading] = useState(false)

  const handleSignOut = () => {
    setLoading(true)
    signOut({ callbackUrl })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:px-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/icon-192x192.png" alt="Trámites Misiones" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-xl sm:text-2xl font-semibold text-gray-800">Trámites Misiones</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 text-center mb-2">Cerrar sesión</h1>
          <p className="text-gray-600 text-sm text-center mb-6">
            ¿Estás seguro de que querés cerrar sesión?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={callbackUrl}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2024 Trámites Misiones - Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}

export default function CerrarSesionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    }>
      <CerrarSesionContent />
    </Suspense>
  )
}
