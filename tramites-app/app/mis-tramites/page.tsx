"use client"

import { Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/components/Toast"

interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  monto: number
  archivoUrl: string | null
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
  const toast = useToast()
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [loading, setLoading] = useState(true)
  const [pagando, setPagando] = useState<string | null>(null)
  const verifiedRef = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const fetchTramites = useCallback(async (): Promise<Tramite[]> => {
    try {
      const res = await fetch("/api/tramites")
      const data = await res.json()
      if (res.ok && Array.isArray(data)) {
        setTramites(data)
        return data
      }
      if (data?.error) {
        toast.showError(data.error)
      }
      setTramites([])
      return []
    } catch (error) {
      console.error(error)
      toast.showError("Error al cargar los trámites")
      setTramites([])
      return []
    } finally {
      setLoading(false)
    }
  }, [toast])

  const verifyPendingPayments = useCallback(
    async (tramitesList: Tramite[]) => {
      if (!Array.isArray(tramitesList)) return
      const pendientes = tramitesList.filter(
        (t) => t.pago?.estado === "pendiente" && t.pago?.mercadopagoId
      )
      if (pendientes.length === 0) return

      try {
        const res = await fetch("/api/mercadopago/verify-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tramiteIds: pendientes.map((t) => t.id),
          }),
        })
        const data = await res.json()
        if (data.updated) {
          await fetchTramites()
        }
      } catch (err) {
        console.error("Error verificando pagos:", err)
      }
    },
    [fetchTramites]
  )

  const handlePagar = async (tramiteId: string) => {
    setPagando(tramiteId)
    try {
      const res = await fetch(`/api/tramites/${tramiteId}/pagar`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        toast.showError(data.error || "Error al generar el pago")
        setPagando(null)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.showError("Error al procesar el pago")
      setPagando(null)
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
  }, [status, router, searchParams, fetchTramites, verifyPendingPayments])

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
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icon-192x192.png" alt="TramitesMisiones" width={32} height={32} className="w-8 h-8" />
              <span className="font-semibold text-gray-800">TramitesMisiones</span>
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 right-0 h-auto max-h-[90vh] w-56 bg-white shadow-lg border border-gray-200 rounded-bl-lg z-50 transform transition-transform duration-200 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Menú</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            aria-label="Cerrar menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-2 flex flex-col gap-1">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            Inicio
          </Link>
          {session?.user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              Panel Admin
            </Link>
          )}
          <hr className="my-1" />
          <Link
            href="/api/auth/signout?callbackUrl=/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Salir
          </Link>
        </div>
      </div>

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
                <div
                  key={tramite.id}
                  className="bg-white border border-gray-200 rounded p-3"
                >
                  <Link href={`/mis-tramites/${tramite.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-gray-900 text-sm truncate">{tramite.tipoTramite}</p>
                        <p className="text-xs text-gray-500 truncate">{tramite.oficina}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        tramite.pago?.estado === "confirmado"
                          ? "bg-green-100 text-green-700"
                          : tramite.pago?.estado === "devuelto"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {tramite.pago?.estado === "confirmado" ? "Pagado" : tramite.pago?.estado === "devuelto" ? "Devuelto" : "Pendiente"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">
                        {new Date(tramite.createdAt).toLocaleDateString("es-AR")} {new Date(tramite.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </Link>
                  {(tramite.pago?.estado === "pendiente" || !tramite.pago) && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handlePagar(tramite.id)}
                        disabled={pagando === tramite.id}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        {pagando === tramite.id ? (
                          "Procesando..."
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                              <line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                            Pagar ${tramite.monto.toLocaleString("es-AR")}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {tramite.archivoUrl && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <a
                        href={tramite.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Descargar PDF
                      </a>
                    </div>
                  )}
                </div>
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
                        {new Date(tramite.createdAt).toLocaleDateString("es-AR")} {new Date(tramite.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getEstadoLabel(tramite.estado)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tramite.pago?.estado === "confirmado" ? "Pagado" : tramite.pago?.estado === "devuelto" ? "Devuelto" : "Pendiente"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/mis-tramites/${tramite.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Ver detalles
                          </Link>
                          {(tramite.pago?.estado === "pendiente" || !tramite.pago) && (
                            <button
                              onClick={() => handlePagar(tramite.id)}
                              disabled={pagando === tramite.id}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-blue-400"
                            >
                              {pagando === tramite.id ? "..." : "Pagar"}
                            </button>
                          )}
                          {tramite.archivoUrl && (
                            <a
                              href={tramite.archivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                              PDF
                            </a>
                          )}
                        </div>
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
            © 2024 TramitesMisiones - Todos los derechos reservados
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
