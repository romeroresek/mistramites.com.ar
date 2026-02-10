"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"

export default function LandingNavbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon-192x192.png" alt="TramitesMisiones" className="w-8 h-8" />
            <span className="font-semibold text-gray-800 hidden sm:inline">TramitesMisiones</span>
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
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700"
                >
                  Mis Tramites
                </Link>
                <Link
                  href="/api/auth/signout?callbackUrl=/"
                  className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                >
                  Salir
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700"
              >
                Acceso Clientes
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
