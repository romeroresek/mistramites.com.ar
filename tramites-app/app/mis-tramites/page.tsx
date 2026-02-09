"use client"

import { Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"

interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  monto: number
  createdAt: string
  pago?: {
    estado: string
    mercadopagoId: string | null
  }
}

function MisTramitesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [loading, setLoading] = useState(true)
  const verifiedRef = useRef(false)

  const fetchTramites = async (): Promise<Tramite[]> => {
    try {
      const res = await fetch("/api/tramites")
      const data = await res.json()
      if (Array.isArray(data)) {
        setTramites(data)
        return data
      }
      setTramites([])
      return []
    } catch (error) {
      console.error(error)
      setTramites([])
      return []
    } finally {
      setLoading(false)
    }
  }

  const verifyPendingPayments = async (tramitesList: Tramite[]) => {
    if (!Array.isArray(tramitesList)) return
    const pendientes = tramitesList.filter(
      (t) => t.pago?.estado === "pendiente" && t.pago?.mercadopagoId
    )

    if (pendientes.length === 0) return

    let updated = false
    for (const tramite of pendientes) {
      try {
        const res = await fetch("/api/mercadopago/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tramiteId: tramite.id }),
        })
        const data = await res.json()
        if (data.pagoEstado === "confirmado") {
          updated = true
        }
      } catch (err) {
        console.error("Error verificando pago:", err)
      }
    }

    if (updated) {
      await fetchTramites()
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      const paymentId = searchParams.get("payment_id")

      if (paymentId && !verifiedRef.current) {
        verifiedRef.current = true
        fetch("/api/mercadopago/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        })
          .then(() => fetchTramites())
          .then(() => router.replace("/mis-tramites"))
          .catch((error) => {
            console.error("Error verificando pago:", error)
            fetchTramites()
          })
      } else {
        fetchTramites().then((data) => verifyPendingPayments(data))
      }
    }
  }, [status, router, searchParams])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case "completado": return "Completado"
      case "en_proceso": return "En proceso"
      case "rechazado": return "Rechazado"
      default: return "Pendiente"
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800 hidden sm:inline">MisTrámites</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">
                Inicio
              </Link>
              {(session?.user as any)?.role === "admin" && (
                <Link href="/admin" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">
                  Admin
                </Link>
              )}
              <Link href="/api/auth/signout" className="text-red-600 hover:text-red-800 text-xs sm:text-sm">
                Salir
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Mis Trámites</h1>
          <Link
            href="/"
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700"
          >
            Nuevo trámite
          </Link>
        </div>

        {tramites.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded p-6 sm:p-8 text-center">
            <p className="text-gray-600 mb-4 text-sm sm:text-base">No tenés trámites registrados</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Iniciar un trámite
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {tramites.map((tramite) => (
                <Link
                  key={tramite.id}
                  href={`/mis-tramites/${tramite.id}`}
                  className="block bg-white border border-gray-200 rounded p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{tramite.tipoTramite}</p>
                      <p className="text-xs text-gray-500 truncate">{tramite.oficina}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      tramite.pago?.estado === "confirmado"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {tramite.pago?.estado === "confirmado" ? "Pagado" : "Pendiente"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">
                      {new Date(tramite.createdAt).toLocaleDateString("es-AR")}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white border border-gray-200 rounded overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Trámite</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Oficina</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pago</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Monto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tramites.map((tramite, index) => (
                    <tr key={tramite.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{tramite.tipoTramite}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{tramite.oficina}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(tramite.createdAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getEstadoLabel(tramite.estado)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tramite.pago?.estado === "confirmado" ? "Pagado" : "Pendiente"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/mis-tramites/${tramite.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Ver detalles
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © 2024 MisTrámites - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function MisTramites() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    }>
      <MisTramitesContent />
    </Suspense>
  )
}
