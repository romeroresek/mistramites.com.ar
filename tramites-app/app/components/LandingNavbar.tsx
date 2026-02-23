"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { FileText } from "lucide-react"

export default function LandingNavbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon-192x192.png" alt="Trámites Misiones" width={32} height={32} className="w-8 h-8" style={{ maxWidth: 32, maxHeight: 32 }} priority />
            <span className="font-semibold text-gray-800 hidden sm:inline">Trámites Misiones</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#partidas" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">Partidas</a>
            <a href="#inmuebles" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">Inmuebles</a>
            <a href="#apostillas" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">Apostillas</a>

            {status === "loading" ? (
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : status === "authenticated" && session?.user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/mis-tramites"
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  Mis Tramites
                </Link>
                <Link
                  href="/cerrar-sesion?callbackUrl=/"
                  className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                >
                  Salir
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center px-3 sm:px-4 py-2 text-gray-700 hover:text-gray-900 text-xs sm:text-sm"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
