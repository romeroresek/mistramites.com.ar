"use client"

import { Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useCallback, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/components/Toast"
import { formatDateTimeAR } from "@/lib/utils"
import { getMercadoPagoPreferenceUrl } from "@/lib/mercadopago"
import { ArrowLeft, Menu, X, CreditCard, Download } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

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

interface VerifyPagoResponse {
  estado: string
  paymentId: string | null
}

interface VerifySingleResponse {
  tramiteId: string
  updated?: boolean
  pago?: VerifyPagoResponse
}

interface VerifyBatchResult {
  tramiteId: string
  updated: boolean
  pago?: VerifyPagoResponse
}

interface VerifyBatchResponse {
  updated: boolean
  results?: VerifyBatchResult[]
}

const getEstadoLabel = (estado: string) => {
  switch (estado) {
    case "completado":
    case "listo": return "Completado"
    case "en_proceso": return "En proceso"
    case "rechazado": return "Rechazado"
    default: return "Pendiente"
  }
}

async function fetchUserTramites(): Promise<Tramite[]> {
  const res = await fetch("/api/tramites", { cache: "no-store" })
  const data: unknown = await res.json()
  if (res.ok && Array.isArray(data)) return data
  if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
    throw new Error(data.error)
  }
  throw new Error("Error al cargar los trámites")
}

function MisTramitesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const queryClient = useQueryClient()
  const verifiedRef = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pagando, setPagando] = useState<string | null>(null)

  const {
    data: tramites = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ["user", "tramites"],
    queryFn: fetchUserTramites,
    enabled: status === "authenticated",
    staleTime: 60_000,
  })

  const mergePaymentResults = useCallback((results: VerifyBatchResult[]) => {
    queryClient.setQueryData<Tramite[]>(["user", "tramites"], (current) => {
      if (!current || results.length === 0) return current

      const byTramiteId = new Map(
        results
          .filter((result): result is VerifyBatchResult & { pago: VerifyPagoResponse } => result.updated && !!result.pago)
          .map((result) => [result.tramiteId, result.pago])
      )

      if (byTramiteId.size === 0) return current

      return current.map((tramite) => {
        const pago = byTramiteId.get(tramite.id)
        if (!pago) return tramite

        return {
          ...tramite,
          pago: {
            estado: pago.estado,
            mercadopagoId: tramite.pago?.mercadopagoId ?? null,
          },
        }
      })
    })
  }, [queryClient])

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
          body: JSON.stringify({ tramiteIds: pendientes.map((t) => t.id) }),
        })
        const data = await res.json() as VerifyBatchResponse
        if (data.updated && Array.isArray(data.results)) {
          mergePaymentResults(data.results)
        }
      } catch (err) {
        console.error("Error verificando pagos:", err)
      }
    },
    [mergePaymentResults]
  )

  const handlePagar = useCallback(async (tramite: Tramite) => {
    setPagando(tramite.id)
    try {
      if (tramite.pago?.estado === "pendiente" && tramite.pago.mercadopagoId) {
        window.location.href = getMercadoPagoPreferenceUrl(tramite.pago.mercadopagoId)
        return
      }

      const res = await fetch(`/api/tramites/${tramite.id}/pagar`, { method: "POST" })
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
  }, [toast])

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
          .then((res) => res.json())
          .then((data: VerifySingleResponse) => {
            if (data.updated && data.pago) {
              mergePaymentResults([
                {
                  tramiteId: data.tramiteId,
                  updated: true,
                  pago: data.pago,
                },
              ])
            }
          })
          .then(() => router.replace("/mis-tramites"))
          .catch((error) => {
            console.error("Error verificando pago:", error)
          })
      }
    }
  }, [status, router, searchParams, mergePaymentResults])

  // Verify payments when tramites load
  const hasVerifiedPayments = useRef(false)
  useEffect(() => {
    if (tramites.length > 0 && !hasVerifiedPayments.current) {
      hasVerifiedPayments.current = true
      void verifyPendingPayments(tramites)
    }
  }, [tramites, verifyPendingPayments])

  // Polling: verificar pagos pendientes cada 5 minutos
  useEffect(() => {
    if (status !== "authenticated") return
    const pendientes = tramites.filter(
      (tramite) => tramite.pago?.estado === "pendiente" && tramite.pago?.mercadopagoId
    )
    if (pendientes.length === 0) return

    const interval = setInterval(async () => {
      try {
        await verifyPendingPayments(pendientes)
      } catch {
        // Silenciar errores de polling
      }
    }, 300000)

    return () => clearInterval(interval)
  }, [status, tramites, verifyPendingPayments])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 min-h-[44px] shrink-0 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-2 -ml-2"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" aria-hidden />
            </Link>
            <Link href="/" className="flex items-center gap-2 min-w-0 flex-1 justify-center">
              <Image src="/icon-192x192.png" alt="Trámites Misiones" width={32} height={32} className="w-8 h-8 shrink-0" style={{ maxWidth: 32, maxHeight: 32 }} priority />
              <span className="font-semibold text-gray-800 truncate">Trámites Misiones</span>
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded -m-1"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
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
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Menú</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded -m-1"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2 flex flex-col gap-1">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] flex items-center"
          >
            Inicio
          </Link>
          {session?.user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] flex items-center"
            >
              Panel Admin
            </Link>
          )}
          <hr className="my-1" />
          <Link
            href="/cerrar-sesion?callbackUrl=/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg min-h-[44px] flex items-center"
          >
            Salir
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Mis Trámites</h1>
        </div>

        {tramites.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
            <p className="text-sm text-gray-600 mb-4">No tenés trámites registrados</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800"
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
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <Link href={`/mis-tramites/${tramite.id}`} className="block min-h-[44px]">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-gray-900 text-sm truncate">{tramite.tipoTramite}</p>
                        <p className="text-sm text-gray-500 truncate">{tramite.oficina}</p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded ${
                        tramite.pago?.estado === "confirmado"
                          ? "bg-green-100 text-green-700"
                          : tramite.pago?.estado === "devuelto"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {tramite.pago?.estado === "confirmado" ? "Pagado" : tramite.pago?.estado === "devuelto" ? "Devuelto" : "Pendiente"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        {formatDateTimeAR(tramite.createdAt)}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </Link>
                  {(tramite.pago?.estado === "pendiente" || !tramite.pago) && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handlePagar(tramite)}
                        disabled={pagando === tramite.id}
                        className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 disabled:opacity-70"
                      >
                        {pagando === tramite.id ? (
                          "Procesando..."
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
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
                        className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800"
                      >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
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
                        {formatDateTimeAR(tramite.createdAt)}
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
                              onClick={() => handlePagar(tramite)}
                              disabled={pagando === tramite.id}
                              className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-70"
                            >
                              {pagando === tramite.id ? "..." : "Pagar"}
                            </button>
                          )}
                          {tramite.archivoUrl && (
                            <a
                              href={tramite.archivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                            >
                              <Download className="w-3 h-3" />
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
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © 2024 Trámites Misiones - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function MisTramites() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Cargando...</p>
      </div>
    }>
      <MisTramitesContent />
    </Suspense>
  )
}
