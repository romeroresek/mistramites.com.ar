"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Filter, X, RefreshCw, Calendar, Menu } from "lucide-react"

interface Log {
  id: string
  tipo: string
  accion: string
  userId: string | null
  userEmail: string | null
  userName: string | null
  tramiteId: string | null
  ip: string | null
  userAgent: string | null
  metadata: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface TipoCount {
  tipo: string
  count: number
}

const tipoColors: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-800",
  LOGIN_FAILED: "bg-red-100 text-red-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  REGISTRO: "bg-blue-100 text-blue-800",
  TRAMITE_CREADO: "bg-purple-100 text-purple-800",
  ESTADO_CAMBIO: "bg-yellow-100 text-yellow-800",
  PAGO_INICIADO: "bg-orange-100 text-orange-800",
  PAGO_CONFIRMADO: "bg-green-100 text-green-800",
  PAGO_FALLIDO: "bg-red-100 text-red-800",
  PAGO_REEMBOLSADO: "bg-pink-100 text-pink-800",
  ADMIN_LOGIN: "bg-indigo-100 text-indigo-800",
  ADMIN_ESTADO_CAMBIADO: "bg-indigo-100 text-indigo-800",
  ADMIN_TRAMITE_EDITADO: "bg-indigo-100 text-indigo-800",
  ADMIN_ARCHIVO_SUBIDO: "bg-indigo-100 text-indigo-800",
  ADMIN_WHATSAPP_ENVIADO: "bg-indigo-100 text-indigo-800",
  ARCHIVO_SUBIDO: "bg-cyan-100 text-cyan-800",
  ARCHIVO_DESCARGADO: "bg-cyan-100 text-cyan-800",
}

const tipoLabels: Record<string, string> = {
  LOGIN: "Login",
  LOGIN_FAILED: "Login fallido",
  LOGOUT: "Logout",
  REGISTRO: "Registro",
  TRAMITE_CREADO: "Trámite creado",
  ESTADO_CAMBIO: "Cambio estado",
  PAGO_INICIADO: "Pago iniciado",
  PAGO_CONFIRMADO: "Pago confirmado",
  PAGO_FALLIDO: "Pago fallido",
  PAGO_REEMBOLSADO: "Reembolso",
  ADMIN_LOGIN: "Admin login",
  ADMIN_ESTADO_CAMBIADO: "Admin: estado",
  ADMIN_TRAMITE_EDITADO: "Admin: edición",
  ADMIN_ARCHIVO_SUBIDO: "Admin: archivo",
  ADMIN_WHATSAPP_ENVIADO: "Admin: WhatsApp",
  ARCHIVO_SUBIDO: "Archivo subido",
  ARCHIVO_DESCARGADO: "Descarga",
}

export default function LogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [tipos, setTipos] = useState<TipoCount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [quickFilter, setQuickFilter] = useState<number | null>(null)

  // Helper para filtros rápidos de fecha
  const setQuickDateFilter = (days: number) => {
    const today = new Date()
    const fromDate = new Date()
    fromDate.setDate(today.getDate() - days + 1)

    setDesde(fromDate.toISOString().split("T")[0])
    setHasta(today.toISOString().split("T")[0])
    setQuickFilter(days)
    setPage(1)
  }

  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "50")
      if (searchTerm) params.set("search", searchTerm)
      if (tipoFilter) params.set("tipo", tipoFilter)
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)

      const res = await fetch(`/api/admin/logs?${params.toString()}`)
      if (!res.ok) throw new Error("Error")
      const data = await res.json()
      setLogs(data.logs)
      setPagination(data.pagination)
      setTipos(data.tipos)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, page])

  const handleSearch = () => {
    setPage(1)
    fetchLogs()
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTipoFilter("")
    setDesde("")
    setHasta("")
    setQuickFilter(null)
    setPage(1)
    setTimeout(() => fetchLogs(), 0)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const parseMetadata = (metadataStr: string | null) => {
    if (!metadataStr) return null
    try {
      return JSON.parse(metadataStr)
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/admin"
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
      </div>

      {/* Menu overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity ${menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 z-[70] w-64 h-full bg-white shadow-lg transform transition-transform ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 flex flex-col gap-2">
          <button onClick={() => setMenuOpen(false)} className="self-end p-2 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
          <Link
            href="/admin"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            Panel Admin
          </Link>
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            Inicio
          </Link>
          <hr className="my-1" />
          <Link
            href="/cerrar-sesion?callbackUrl=/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Salir
          </Link>
        </div>
      </div>

      {/* Main */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex-1">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Registro de Actividad</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg min-h-[44px] ${showFilters ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 min-h-[44px] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filtros rápidos de fecha */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Período:
          </span>
          {[
            { days: 1, label: "Hoy" },
            { days: 3, label: "3 días" },
            { days: 7, label: "7 días" },
            { days: 30, label: "30 días" },
          ].map(({ days, label }) => (
            <button
              key={days}
              onClick={() => {
                setQuickDateFilter(days)
                setTimeout(() => fetchLogs(), 0)
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                quickFilter === days
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
          {quickFilter && (
            <button
              onClick={() => {
                setDesde("")
                setHasta("")
                setQuickFilter(null)
                setPage(1)
                setTimeout(() => fetchLogs(), 0)
              }}
              className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              title="Quitar filtro de fecha"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros expandibles */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Email, acción, trámite..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  {tipos.map((t) => (
                    <option key={t.tipo} value={t.tipo}>
                      {tipoLabels[t.tipo] || t.tipo} ({t.count})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => {
                    setDesde(e.target.value)
                    setQuickFilter(null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => {
                    setHasta(e.target.value)
                    setQuickFilter(null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Limpiar
              </button>
              <button
                onClick={handleSearch}
                className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        )}

        {/* Stats rápidas */}
        {pagination && (
          <p className="text-sm text-gray-500 mb-4">
            Mostrando {logs.length} de {pagination.total} registros
          </p>
        )}

        {/* Tabla de logs */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Acción</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Trámite</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No hay registros de actividad
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const metadata = parseMetadata(log.metadata)
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tipoColors[log.tipo] || "bg-gray-100 text-gray-800"}`}>
                            {tipoLabels[log.tipo] || log.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900 max-w-xs truncate" title={log.accion}>
                          {log.accion}
                          {metadata && (
                            <span className="block text-xs text-gray-400 truncate">
                              {JSON.stringify(metadata).substring(0, 50)}...
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {log.userEmail || log.userName || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {log.tramiteId ? (
                            <Link href={`/admin?tramite=${log.tramiteId}`} className="text-blue-600 hover:underline font-mono text-xs">
                              {log.tramiteId.substring(0, 8)}...
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          {log.ip || "-"}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © {new Date().getFullYear()} Trámites Misiones - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
