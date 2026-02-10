"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"

export default function NavbarAuth() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
    )
  }

  if (status === "authenticated" && session?.user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/mis-tramites"
          className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700"
        >
          Mis Trámites
        </Link>
        <Link
          href="/api/auth/signout"
          className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
        >
          Salir
        </Link>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700"
    >
      Acceso Clientes
    </Link>
  )
}
