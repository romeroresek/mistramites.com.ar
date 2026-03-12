"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ChevronLeft, ChevronRight, Home, FileText, LogOut, Users, FileStack, PlusCircle, RefreshCw, Bell, BellOff, Search, X, Activity, Menu } from "lucide-react"
import { useToast } from "@/components/Toast"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useAdminTramites } from "./components/useAdminTramites"
import type { AdminTramitesFilter, Tramite } from "./components/types"
import { TramiteCard } from "./components/TramiteCard"
import { TramiteRow } from "./components/TramiteRow"
import { WhatsAppModal } from "./components/WhatsAppModal"
import { UploadDrawer } from "./components/UploadDrawer"
import { DeleteDialog } from "./components/DeleteDialog"
import { ClienteDataModal } from "./components/ClienteDataModal"
import type { Plantilla } from "./components/types"

const PAGE_SIZE = 25

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<AdminTramitesFilter>(null)

  // React Query para tramites
  const {
    tramites,
    pagination,
    stats,
    isLoading: loading,
    isFetching,
    isPlaceholderData,
    refetch,
    invalidate,
    verifyPayments,
    updateStatus,
    saveObservaciones: saveObsMutation,
    isSavingObs: savingObs,
    deleteTramite,
    isDeleting: deleting,
  } = useAdminTramites({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearchTerm,
    filterStatus,
  })

  // UI state
  const [menuOpen, setMenuOpen] = useState(false)
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [whatsappTramite, setWhatsappTramite] = useState<Tramite | null>(null)
  const [isMobile, setIsMobile] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [editingObsId, setEditingObsId] = useState<string | null>(null)
  const [editingObsValue, setEditingObsValue] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [uploadTramite, setUploadTramite] = useState<Tramite | null>(null)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const pushNotifications = usePushNotifications()

  // Contacto drawer state
  const [creadoContactoTramiteId, setCreadoContactoTramiteId] = useState<string | null>(null)
  const [creadoPaymentLink, setCreadoPaymentLink] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsMobile(!mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(!e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    const normalizedSearch = searchTerm.trim()
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(normalizedSearch)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearchTerm, filterStatus])

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(Math.max(1, pagination.totalPages))
    }
  }, [page, pagination.totalPages])

  // Plantillas
  const fetchPlantillas = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/plantillas")
      if (!res.ok) return
      const data = await res.json()
      setPlantillas(data)
    } catch (error) {
      console.error(error)
    }
  }, [])

  // Push settings
  const fetchPushSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/push-settings")
      if (res.ok) {
        const data = await res.json()
        setPushEnabled(data.enabled)
      }
    } catch (error) {
      console.error("Error fetching push settings:", error)
    }
  }, [])

  const togglePushNotifications = useCallback(async () => {
    if (pushLoading) return
    setPushLoading(true)
    try {
      if (!pushEnabled) {
        const result = await pushNotifications.subscribe()
        if (!result.success) {
          toast.showError(result.error || "No se pudo activar las notificaciones.")
          setPushLoading(false)
          return
        }
      }
      const res = await fetch("/api/admin/push-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !pushEnabled }),
      })
      if (res.ok) {
        const data = await res.json()
        setPushEnabled(data.enabled)
        toast.showSuccess(data.enabled ? "Notificaciones activadas" : "Notificaciones desactivadas")
      } else {
        toast.showError("Error al actualizar configuración")
      }
    } catch (error) {
      console.error("Error toggling push:", error)
      toast.showError("Error al actualizar notificaciones")
    } finally {
      setPushLoading(false)
    }
  }, [pushLoading, pushEnabled, pushNotifications, toast])

  // Initial load
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.push("/login"); return }
    if (session?.user?.role !== "admin") { router.push("/"); return }

    fetchPlantillas()
    fetchPushSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar o cambiar sesión
  }, [status, session, router])

  // Verify payments when the current page payload changes
  const lastVerifiedKey = useRef("")
  const verificationKey = useMemo(
    () =>
      `${page}:${debouncedSearchTerm}:${filterStatus ?? "all"}:${tramites
        .map(
          (tramite) =>
            `${tramite.id}:${tramite.pago?.estado ?? ""}:${tramite.pago?.paymentId ?? ""}:${tramite.pago?.mercadopagoId ?? ""}`
        )
        .join("|")}`,
    [page, debouncedSearchTerm, filterStatus, tramites]
  )

  useEffect(() => {
    if (tramites.length === 0) return
    if (isPlaceholderData) return
    if (lastVerifiedKey.current === verificationKey) return

    lastVerifiedKey.current = verificationKey
    void verifyPayments(tramites)
  }, [tramites, verifyPayments, verificationKey, isPlaceholderData])

  // Toast y drawer de contacto cuando vuelve de crear un trámite
  const creadoToastShown = useRef(false)
  useEffect(() => {
    const creado = searchParams.get("creado")
    if (creado !== "1" || creadoToastShown.current) return
    creadoToastShown.current = true
    const tramiteId = searchParams.get("tramiteId")
    const initPoint = searchParams.get("initPoint")
    if (initPoint) {
      toast.showSuccess("Trámite creado. Completá el email del cliente para que pueda iniciar sesión y copiá el link de pago.")
    } else {
      toast.showSuccess("Trámite creado. Completá el email del cliente para que pueda iniciar sesión.")
    }
    if (tramiteId) setCreadoContactoTramiteId(tramiteId)
    if (initPoint) setCreadoPaymentLink(initPoint)
    setPage(1)
    invalidate()
    router.replace("/admin", { scroll: false })
  }, [searchParams, router, toast, invalidate])

  // Cerrar menú de acciones al hacer click fuera
  useEffect(() => {
    if (!actionMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-action-menu]")) setActionMenuId(null)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [actionMenuId])

  // Callbacks para componentes hijos (estables con useCallback)
  const copiarLinkPagoLista = useCallback(async (tramiteId: string) => {
    const tramite = tramites.find((item) => item.id === tramiteId)
    const initPoint = tramite?.pago?.mercadopagoId
      ? `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${tramite.pago.mercadopagoId}`
      : null

    if (!initPoint) {
      toast.showError("No se pudo obtener el link de pago")
      return
    }

    try {
      await navigator.clipboard.writeText(initPoint)
      toast.showSuccess("Link copiado al portapapeles")
    } catch {
      toast.showError("Error al obtener el link de pago")
    }
  }, [toast, tramites])

  const handleUpdateStatus = useCallback(
    (tramiteId: string, field: "estado" | "pagoEstado", value: string) => {
      updateStatus({ tramiteId, field, value })
    },
    [updateStatus]
  )

  const handleSaveObservaciones = useCallback(
    async (tramiteId: string) => {
      await saveObsMutation({ tramiteId, observaciones: editingObsValue || null })
      setEditingObsId(null)
    },
    [saveObsMutation, editingObsValue]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    await deleteTramite(deleteId)
    setDeleteId(null)
  }, [deleteId, deleteTramite])

  const handleSetEditingObs = useCallback((id: string | null, value: string) => {
    setEditingObsId(id)
    setEditingObsValue(value)
  }, [])

  if (loading) {
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
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 right-0 h-auto max-h-[90vh] w-56 bg-white shadow-lg border border-gray-200 rounded-bl-lg z-50 transform transition-transform duration-200 ease-out ${menuOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"}`}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Menú Admin</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded -m-1"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2 flex flex-col gap-1">
          <Link href="/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] flex items-center gap-2">
            <Home className="w-4 h-4 shrink-0" />Inicio
          </Link>
          <Link href="/mis-tramites" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] flex items-center gap-2">
            <FileText className="w-4 h-4 shrink-0" />Mis Trámites
          </Link>
          <hr className="my-1" />
          <button
            onClick={togglePushNotifications}
            disabled={pushLoading || pushNotifications.isLoading}
            className={`px-3 py-2.5 text-sm rounded-lg min-h-[44px] flex items-center gap-2 w-full text-left disabled:opacity-50 ${pushEnabled ? "text-green-600 hover:bg-green-50" : "text-gray-700 hover:bg-gray-100"}`}
          >
            {pushEnabled ? <Bell className="w-4 h-4 shrink-0" /> : <BellOff className="w-4 h-4 shrink-0" />}
            {pushLoading || pushNotifications.isLoading ? "Cargando..." : pushEnabled ? "Notificaciones ON" : "Notificaciones OFF"}
          </button>
          <hr className="my-1" />
          <Link href="/cerrar-sesion?callbackUrl=/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg min-h-[44px] flex items-center gap-2">
            <LogOut className="w-4 h-4 shrink-0" />Salir
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Panel de Administrador</h1>
            <div className="flex items-center gap-2 relative z-10">
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === "pendiente" ? null : "pendiente")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-sm font-medium rounded-full border transition-all select-none cursor-pointer touch-manipulation active:scale-95 ${
                  filterStatus === "pendiente"
                    ? "bg-yellow-500 text-white border-yellow-600 ring-2 ring-yellow-300 shadow-sm"
                    : "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 active:bg-yellow-300 shadow-sm"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${filterStatus === "pendiente" ? "bg-white" : "bg-yellow-500"}`}></span>
                Pendientes: {stats.pendientesCount}
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === "en_proceso" ? null : "en_proceso")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-sm font-medium rounded-full border transition-all select-none cursor-pointer touch-manipulation active:scale-95 ${
                  filterStatus === "en_proceso"
                    ? "bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300 shadow-sm"
                    : "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 active:bg-blue-300 shadow-sm"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${filterStatus === "en_proceso" ? "bg-white" : "bg-blue-500"}`}></span>
                En curso: {stats.enProcesoCount}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Buscador */}
            <div className="relative order-2 basis-full mt-1 sm:order-none sm:basis-auto sm:mt-0 sm:ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-h-[40px] sm:min-h-[44px] w-full sm:w-48 py-2 pl-9 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={async () => {
                setRefreshing(true)
                try {
                  const result = await refetch()
                  await verifyPayments(result.data?.data ?? tramites)
                  toast.showSuccess("Lista actualizada")
                } catch (err) {
                  console.error("Error al refrescar:", err)
                  toast.showError("Error al sincronizar con MercadoPago")
                } finally {
                  setRefreshing(false)
                }
              }}
              disabled={refreshing}
              className="inline-flex items-center justify-center min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] px-2.5 sm:px-3 py-2.5 sm:py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60"
              title="Actualizar lista y sincronizar pagos con MercadoPago"
              aria-label="Refrescar lista"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <Link href="/?returnUrl=/admin" className="inline-flex items-center justify-center min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] px-2.5 sm:px-3 py-2.5 sm:py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100" title="Crear trámite con datos del solicitante" aria-label="Nuevo trámite">
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link href="/admin/plantillas" className="inline-flex items-center justify-center min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] px-2.5 sm:px-3 py-2.5 sm:py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100" title="Plantillas" aria-label="Plantillas">
              <FileStack className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link href="/admin/usuarios" className="inline-flex items-center justify-center min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] px-2.5 sm:px-3 py-2.5 sm:py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100" title="Usuarios" aria-label="Usuarios">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link href="/admin/logs" className="inline-flex items-center justify-center min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] px-2.5 sm:px-3 py-2.5 sm:py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100" title="Registro de Actividad" aria-label="Registro de Actividad">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <p className="text-sm text-gray-500">
            {pagination.total === 0
              ? "No hay resultados para los filtros actuales."
              : `Mostrando ${Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} de ${pagination.total} trámites`}
          </p>
          {isFetching && !refreshing && (
            <p className="text-xs text-gray-400">Actualizando lista...</p>
          )}
        </div>

        {/* Empty State */}
        {tramites.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">
              {debouncedSearchTerm ? "No se encontraron resultados." : "No hay trámites registrados."}
            </p>
          </div>
        )}

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {tramites.map((tramite) => (
            <TramiteCard
              key={tramite.id}
              tramite={tramite}
              editingObsId={editingObsId}
              editingObsValue={editingObsValue}
              savingObs={savingObs}
              actionMenuId={actionMenuId}
              onOpenWhatsapp={setWhatsappTramite}
              onUpdateStatus={handleUpdateStatus}
              onSaveObservaciones={handleSaveObservaciones}
              onCopiarLinkPago={copiarLinkPagoLista}
              onOpenUpload={setUploadTramite}
              onSetDeleteId={setDeleteId}
              onSetEditingObs={handleSetEditingObs}
              onSetActionMenu={setActionMenuId}
            />
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trámite</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Detalle</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">Detalle MP</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Observaciones</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tramites.map((tramite) => (
                <TramiteRow
                  key={tramite.id}
                  tramite={tramite}
                  editingObsId={editingObsId}
                  editingObsValue={editingObsValue}
                  savingObs={savingObs}
                  actionMenuId={actionMenuId}
                  onOpenWhatsapp={setWhatsappTramite}
                  onUpdateStatus={handleUpdateStatus}
                  onSaveObservaciones={handleSaveObservaciones}
                  onCopiarLinkPago={copiarLinkPagoLista}
                  onOpenUpload={setUploadTramite}
                  onSetDeleteId={setDeleteId}
                  onSetEditingObs={handleSetEditingObs}
                  onSetActionMenu={setActionMenuId}
                />
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <p className="text-sm text-gray-500">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={pagination.page <= 1 || isFetching}
                className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((currentPage) => Math.min(pagination.totalPages, currentPage + 1))}
                disabled={pagination.page >= pagination.totalPages || isFetching}
                className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © {new Date().getFullYear()} Trámites Misiones - Todos los derechos reservados
          </p>
        </div>
      </footer>

      {/* Modals */}
      <WhatsAppModal
        tramite={whatsappTramite}
        plantillas={plantillas}
        isMobile={isMobile}
        onClose={() => setWhatsappTramite(null)}
      />

      <ClienteDataModal
        tramiteId={creadoContactoTramiteId}
        initialPaymentLink={creadoPaymentLink}
        initialTramite={tramites.find((tramite) => tramite.id === creadoContactoTramiteId) ?? null}
        isMobile={isMobile}
        onClose={() => { setCreadoContactoTramiteId(null); setCreadoPaymentLink(null) }}
        onSaved={invalidate}
      />

      <UploadDrawer
        tramite={uploadTramite}
        onClose={() => setUploadTramite(null)}
        onUploaded={invalidate}
      />

      <DeleteDialog
        open={!!deleteId}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
