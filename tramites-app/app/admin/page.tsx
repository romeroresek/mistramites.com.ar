"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Home, FileText, LogOut, Pencil, Trash2, Users, FileStack, PlusCircle, Link as LinkIcon, RefreshCw, Upload, Bell, BellOff, Search, X, MoreVertical, StickyNote } from "lucide-react"
import { useToast } from "@/components/Toast"
import { generateWhatsAppLink } from "@/lib/contactTemplates"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"

interface Plantilla {
  id: string
  clave: string
  nombre: string
  mensaje: string
  activo: boolean
}

interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  observaciones: string | null
  user: { name: string; email: string } | null
  guestEmail: string | null
  whatsapp: string | null
  monto: number
  createdAt: string
  archivoUrl: string | null
  pago?: {
    estado: string
    mercadopagoId: string | null
    paymentId: string | null
    payerEmail: string | null
    payerName: string | null
    payerDni: string | null
    paymentMethod: string | null
    paymentDate: string | null
  }
  partida?: {
    tipoPartida: string
    nombres: string
    apellido: string
    dni: string | null
    sexo: string | null
    fechaNacimiento: string | null
    ciudadNacimiento: string | null
    whatsapp: string | null
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [whatsappTramite, setWhatsappTramite] = useState<Tramite | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [editandoPlantillaId, setEditandoPlantillaId] = useState<string | null>(null)
  const [editMensaje, setEditMensaje] = useState("")
  const [savingPlantilla, setSavingPlantilla] = useState(false)
  const [whatsappLinkPago, setWhatsappLinkPago] = useState<string | null>(null)
  const [creadoContactoTramiteId, setCreadoContactoTramiteId] = useState<string | null>(null)
  const [creadoContactoForm, setCreadoContactoForm] = useState({ email: "", whatsapp: "" })
  const [creadoContactoLoading, setCreadoContactoLoading] = useState(false)
  const [creadoContactoSaving, setCreadoContactoSaving] = useState(false)
  const [creadoPaymentLink, setCreadoPaymentLink] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [uploadTramite, setUploadTramite] = useState<Tramite | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  const [editingObsId, setEditingObsId] = useState<string | null>(null)
  const [editingObsValue, setEditingObsValue] = useState("")
  const [savingObs, setSavingObs] = useState(false)
  const pushNotifications = usePushNotifications()

  const fetchTramites = async () => {
    try {
      const res = await fetch("/api/admin/tramites")
      if (!res.ok) {
        setTramites([])
        return []
      }
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

  // Sincroniza estado de pago con MercadoPago
  // - pendientes con mercadopagoId o paymentId → verifica si ya pagaron
  // - confirmados → verifica reembolsos o carga datos faltantes
  // IMPORTANTE: Nunca sobreescribe cambios manuales del admin en el estado del trámite
  const verifyPaymentsWithMp = async (tramitesList: Tramite[]) => {
    if (!Array.isArray(tramitesList)) return
    const conPago = tramitesList.filter(
      (t) => t.pago && (
        // Pendientes con link de MP o paymentId conocido
        (t.pago.estado === "pendiente" && (t.pago.mercadopagoId || t.pago.paymentId)) ||
        // Confirmados (verificar reembolsos o cargar datos faltantes)
        t.pago.estado === "confirmado"
      )
    )
    if (conPago.length === 0) return

    let anyRealUpdate = false
    for (const tramite of conPago) {
      try {
        const res = await fetch("/api/mercadopago/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tramiteId: tramite.id,
            paymentId: tramite.pago?.paymentId || undefined,
          }),
        })
        if (!res.ok) {
          console.warn(`Verify failed for tramite ${tramite.id}:`, res.status)
          continue
        }
        const data = await res.json()
        // Solo contar como actualización si el estado de pago realmente cambió
        if (data.updated && data.pagoEstado && data.pagoEstado !== tramite.pago?.estado) {
          anyRealUpdate = true
        }
      } catch (err) {
        console.warn("Error verificando pago para tramite", tramite.id, err)
      }
    }

    // Solo recargar si realmente cambió un estado de pago (ej. de pendiente a confirmado)
    if (anyRealUpdate) {
      try {
        await fetchTramites()
      } catch {
        // Ignorar error de fetch final
      }
    }
  }

  const fetchPlantillas = async () => {
    try {
      const res = await fetch("/api/admin/plantillas")
      if (!res.ok) return
      const data = await res.json()
      setPlantillas(data)
      if (data.length > 0) setSelectedTemplate(data.find((p: Plantilla) => p.clave === "recordatorioPago")?.clave || data[0].clave)
    } catch (error) {
      console.error(error)
    }
  }

  const generarMensaje = (plantillaClave: string, tramite: Tramite): string => {
    const plantilla = plantillas.find(p => p.clave === plantillaClave)
    if (!plantilla) return ""

    const formatFecha = (fecha: string | null | undefined): string => {
      if (!fecha) return ""
      try {
        return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
      } catch { return "" }
    }

    // Variables disponibles para las plantillas
    const variables: Record<string, string> = {
      nombre: tramite.partida?.nombres || tramite.user?.name || "Usuario",
      apellido: tramite.partida?.apellido || "",
      nombreCompleto: tramite.partida
        ? `${tramite.partida.nombres} ${tramite.partida.apellido}`.trim()
        : tramite.user?.name || "Usuario",
      dni: tramite.partida?.dni || "",
      sexo: tramite.partida?.sexo || "",
      fechaNacimiento: formatFecha(tramite.partida?.fechaNacimiento),
      ciudadNacimiento: tramite.partida?.ciudadNacimiento || "",
      tipo: tramite.tipoTramite,
      monto: tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 }),
      linkPago: whatsappLinkPago || getLinkPagoUrl(tramite),
      email: tramite.guestEmail || tramite.user?.email || "",
      whatsapp: tramite.whatsapp || tramite.partida?.whatsapp || "",
      fecha: formatFecha(tramite.createdAt),
    }

    let mensaje = plantilla.mensaje
    for (const [key, value] of Object.entries(variables)) {
      mensaje = mensaje.replace(new RegExp(`\\{${key}\\}`, "g"), value)
    }
    return mensaje
  }

  const getWhatsappNumber = (tramite: Tramite): string | null =>
    tramite.whatsapp || tramite.partida?.whatsapp || null

  // Filtrar trámites por búsqueda
  const filteredTramites = tramites.filter((tramite) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase().trim()
    const searchFields = [
      tramite.user?.name,
      tramite.user?.email,
      tramite.guestEmail,
      tramite.whatsapp,
      tramite.partida?.whatsapp,
      tramite.partida?.nombres,
      tramite.partida?.apellido,
      tramite.partida?.dni,
      tramite.partida?.ciudadNacimiento,
      tramite.tipoTramite,
    ]
    return searchFields.some((field) => field?.toLowerCase().includes(term))
  })

  const tieneLinkPago = (tramite: Tramite): boolean =>
    !!(
      tramite.pago?.estado === "pendiente" &&
      tramite.pago?.mercadopagoId
    )

  const getLinkPagoUrl = (tramite: Tramite): string =>
    tieneLinkPago(tramite) && tramite.pago?.mercadopagoId
      ? `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${tramite.pago.mercadopagoId}`
      : ""

  const copiarLinkPagoLista = async (tramiteId: string) => {
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}/link-pago`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.showError(data?.error || "No se pudo obtener el link de pago")
        return
      }
      const { initPoint } = await res.json()
      if (initPoint) {
        await navigator.clipboard.writeText(initPoint)
        toast.showSuccess("Link copiado al portapapeles")
      }
    } catch {
      toast.showError("Error al obtener el link de pago")
    }
  }

  const openWhatsappModal = (tramite: Tramite) => {
    setWhatsappTramite(tramite)
    setEditandoPlantillaId(null)
    setWhatsappLinkPago(null)
    if (plantillas.length > 0) setSelectedTemplate(plantillas.find(p => p.clave === "recordatorioPago")?.clave || plantillas[0].clave)
    // Obtener link de pago real si tiene pago pendiente
    if (tieneLinkPago(tramite)) {
      fetch(`/api/admin/tramites/${tramite.id}/link-pago`)
        .then((res) => res.ok ? res.json() : null)
        .then((data: { initPoint?: string } | null) => {
          if (data?.initPoint) setWhatsappLinkPago(data.initPoint)
        })
        .catch(() => { })
    }
  }

  const openUploadModal = (tramite: Tramite) => {
    setUploadTramite(tramite)
    setUploadError("")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTramite) return

    if (file.type !== "application/pdf") {
      setUploadError("Solo se permiten archivos PDF")
      return
    }

    setUploading(true)
    setUploadError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`/api/admin/tramites/${uploadTramite.id}/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        toast.showSuccess("Archivo subido correctamente")
        setUploadTramite(null)
        fetchTramites()
      } else {
        setUploadError(data.error || "Error al subir archivo")
      }
    } catch {
      setUploadError("Error al subir archivo")
    } finally {
      setUploading(false)
    }
  }

  const plantillaSeleccionada = plantillas.find(p => p.clave === selectedTemplate)

  const iniciarEdicionPlantilla = () => {
    if (plantillaSeleccionada) {
      setEditandoPlantillaId(plantillaSeleccionada.id)
      setEditMensaje(plantillaSeleccionada.mensaje)
    }
  }

  const cancelarEdicionPlantilla = () => {
    setEditandoPlantillaId(null)
    setEditMensaje("")
  }

  const guardarPlantilla = async () => {
    if (!plantillaSeleccionada || plantillaSeleccionada.id !== editandoPlantillaId) return
    setSavingPlantilla(true)
    try {
      const res = await fetch("/api/admin/plantillas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plantillaSeleccionada.id,
          nombre: plantillaSeleccionada.nombre,
          mensaje: editMensaje,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPlantillas(prev => prev.map(p => p.id === updated.id ? updated : p))
        setEditandoPlantillaId(null)
        setEditMensaje("")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSavingPlantilla(false)
    }
  }

  const updateTramiteStatus = async (tramiteId: string, field: "estado" | "pagoEstado", value: string) => {
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (res.ok) {
        setTramites(prev => prev.map(t => {
          if (t.id !== tramiteId) return t
          if (field === "estado") return { ...t, estado: value }
          if (field === "pagoEstado" && t.pago) return { ...t, pago: { ...t.pago, estado: value } }
          return t
        }))
      }
    } catch (error) {
      console.error(error)
    }
  }

  const saveObservaciones = async (tramiteId: string) => {
    setSavingObs(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observaciones: editingObsValue || null }),
      })
      if (res.ok) {
        setTramites(prev => prev.map(t =>
          t.id === tramiteId ? { ...t, observaciones: editingObsValue || null } : t
        ))
        setEditingObsId(null)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSavingObs(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/tramites/${deleteId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setTramites(tramites.filter((t) => t.id !== deleteId))
        setDeleteId(null)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  const fetchPushSettings = async () => {
    try {
      const res = await fetch("/api/admin/push-settings")
      if (res.ok) {
        const data = await res.json()
        setPushEnabled(data.enabled)
      }
    } catch (error) {
      console.error("Error fetching push settings:", error)
    }
  }

  const togglePushNotifications = async () => {
    if (pushLoading) return
    setPushLoading(true)

    try {
      // Si está desactivado y queremos activar, primero suscribir al browser
      if (!pushEnabled) {
        const result = await pushNotifications.subscribe()
        if (!result.success) {
          toast.showError(result.error || "No se pudo activar las notificaciones.")
          setPushLoading(false)
          return
        }
      }

      // Actualizar en el servidor
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
  }

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (session?.user?.role !== "admin") {
      router.push("/")
      return
    }

    fetchTramites().then((data) => verifyPaymentsWithMp(data))
    fetchPlantillas()
    fetchPushSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch/verify solo al montar o cambiar sesión
  }, [status, session, router])

  // Polling automático: verificar pagos pendientes cada 30 segundos
  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return

    const interval = setInterval(async () => {
      try {
        const freshList = await fetchTramites()
        if (Array.isArray(freshList)) {
          const pendientes = freshList.filter(
            (t: Tramite) => t.pago?.estado === "pendiente" && (t.pago?.mercadopagoId || t.pago?.paymentId)
          )
          if (pendientes.length > 0) {
            await verifyPaymentsWithMp(freshList)
          }
        }
      } catch {
        // Silenciar errores de polling
      }
    }, 30000) // cada 30 segundos

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session])

  // Toast, drawer de contacto y limpieza de URL cuando vuelve de crear un trámite
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
    fetchTramites()
    router.replace("/admin", { scroll: false })
  }, [searchParams, router, toast])

  // No sobrescribir el formulario si el usuario ya editó (la respuesta puede llegar después)
  const creadoContactoFormEditado = useRef(false)

  // Al abrir el drawer de contacto, cargar datos del trámite
  useEffect(() => {
    if (!creadoContactoTramiteId) return
    creadoContactoFormEditado.current = false
    setCreadoContactoLoading(true)
    fetch(`/api/admin/tramites/${creadoContactoTramiteId}`)
      .then((res) => res.ok ? res.json() : null)
      .then(async (t: Tramite | null) => {
        if (t && !creadoContactoFormEditado.current) {
          setCreadoContactoForm({
            email: t.guestEmail || t.user?.email || "",
            whatsapp: t.whatsapp || t.partida?.whatsapp || "",
          })
          if (t.pago?.mercadopagoId) {
            try {
              const linkRes = await fetch(`/api/admin/tramites/${creadoContactoTramiteId}/link-pago`)
              if (linkRes.ok) {
                const { initPoint } = await linkRes.json()
                if (initPoint) setCreadoPaymentLink((prev) => prev || initPoint)
              }
            } catch {
              setCreadoPaymentLink((prev) => prev || `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${t.pago!.mercadopagoId}`)
            }
          }
        }
      })
      .catch(() => { })
      .finally(() => setCreadoContactoLoading(false))
  }, [creadoContactoTramiteId])

  const guardarCreadoContacto = async () => {
    if (!creadoContactoTramiteId) return
    setCreadoContactoSaving(true)
    const email = creadoContactoForm.email?.trim() || null
    try {
      const res = await fetch(`/api/admin/tramites/${creadoContactoTramiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestEmail: email }),
      })
      if (res.ok) {
        await fetchTramites()
        setCreadoContactoTramiteId(null)
        setCreadoPaymentLink(null)
        toast.showSuccess("Datos del cliente guardados")
      } else {
        const err = await res.json().catch(() => ({}))
        toast.showError(err?.error || "No se pudieron guardar los datos")
      }
    } catch (error) {
      console.error(error)
      toast.showError("Error al guardar. Intentá de nuevo.")
    } finally {
      setCreadoContactoSaving(false)
    }
  }

  const cerrarCreadoContacto = () => {
    setCreadoContactoTramiteId(null)
    setCreadoPaymentLink(null)
    setCopiedLink(false)
  }

  const copiarLinkPago = () => {
    if (!creadoPaymentLink) return
    navigator.clipboard.writeText(creadoPaymentLink).then(() => {
      setCopiedLink(true)
      toast.showSuccess("Link copiado al portapapeles")
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  // Cerrar menú de acciones al hacer click fuera
  useEffect(() => {
    if (!actionMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [actionMenuId])

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
              <Image src="/icon-192x192.png" alt="Trámites Misiones" width={32} height={32} className="w-8 h-8 shrink-0" />
              <span className="font-semibold text-gray-800 truncate">Trámites Misiones</span>
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded -m-1"
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
        className={`fixed top-0 right-0 h-auto max-h-[90vh] w-56 bg-white shadow-lg border border-gray-200 rounded-bl-lg z-50 transform transition-transform duration-200 ease-out ${menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Menú Admin</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded -m-1"
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
            className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] flex items-center gap-2"
          >
            <Home className="w-4 h-4 shrink-0" />
            Inicio
          </Link>
          <Link
            href="/mis-tramites"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] flex items-center gap-2"
          >
            <FileText className="w-4 h-4 shrink-0" />
            Mis Trámites
          </Link>
          <hr className="my-1" />
          <button
            onClick={togglePushNotifications}
            disabled={pushLoading || pushNotifications.isLoading}
            className={`px-3 py-2.5 text-sm rounded-lg min-h-[44px] flex items-center gap-2 w-full text-left disabled:opacity-50 ${
              pushEnabled ? "text-green-600 hover:bg-green-50" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {pushEnabled ? <Bell className="w-4 h-4 shrink-0" /> : <BellOff className="w-4 h-4 shrink-0" />}
            {pushLoading || pushNotifications.isLoading ? "Cargando..." : pushEnabled ? "Notificaciones ON" : "Notificaciones OFF"}
          </button>
          <hr className="my-1" />
          <Link
            href="/cerrar-sesion?callbackUrl=/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg min-h-[44px] flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Salir
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Panel de Administrador</h1>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                En proceso: {tramites.filter(t => t.estado === "en_proceso").length}
              </span>


            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-h-[44px] pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  const list = await fetchTramites()
                  await verifyPaymentsWithMp(Array.isArray(list) ? list : tramites)
                  toast.showSuccess("Lista actualizada")
                } catch (err) {
                  console.error("Error al refrescar:", err)
                  toast.showError("Error al sincronizar con MercadoPago")
                } finally {
                  setRefreshing(false)
                }
              }}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60"
              title="Actualizar lista y sincronizar pagos con MercadoPago"
              aria-label="Refrescar lista"
            >
              <RefreshCw className={`w-5 h-5 shrink-0 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
            <Link
              href="/?returnUrl=/admin"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100"
              title="Crear trámite con datos del solicitante"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo trámite</span>
            </Link>
            <Link
              href="/admin/plantillas"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100"
              title="Plantillas"
            >
              <FileStack className="w-5 h-5" />
              <span className="hidden sm:inline">Plantillas</span>
            </Link>
            <Link
              href="/admin/usuarios"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100"
              title="Usuarios"
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Usuarios</span>
            </Link>
          </div>
        </div>

        {/* Empty State */}
        {filteredTramites.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">
              {searchTerm ? "No se encontraron resultados." : "No hay trámites registrados."}
            </p>
          </div>
        )}

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredTramites.map((tramite) => (
            <div key={tramite.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {/* Usuario */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{tramite.user?.name ?? "Invitado"}</p>
                  <p className="text-gray-400 text-xs truncate">{tramite.user?.email ?? tramite.guestEmail}</p>
                  {getWhatsappNumber(tramite) && (
                    <button
                      onClick={() => openWhatsappModal(tramite)}
                      className="text-green-600 hover:text-green-700 text-xs flex items-center gap-1 mt-0.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {getWhatsappNumber(tramite)}
                    </button>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-gray-900 text-sm">{tramite.tipoTramite}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(tramite.createdAt).toLocaleDateString("es-AR")} {new Date(tramite.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {/* Detalle (Partida) */}
              {tramite.partida && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-gray-900 text-sm font-medium">
                    {tramite.partida.apellido}, {tramite.partida.nombres}
                    {tramite.partida.sexo && <span className="text-gray-500 font-normal"> ({tramite.partida.sexo})</span>}
                  </p>
                  {tramite.partida.dni && <p className="text-gray-500 text-xs">DNI: {tramite.partida.dni}</p>}
                  {tramite.partida.fechaNacimiento && (
                    <p className="text-gray-500 text-xs">Nac: {new Date(tramite.partida.fechaNacimiento).toLocaleDateString("es-AR")}</p>
                  )}
                  {tramite.partida.ciudadNacimiento && <p className="text-gray-400 text-xs">{tramite.partida.ciudadNacimiento}</p>}
                </div>
              )}

              {/* Estados */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Pago:</span>
                  <select
                    value={tramite.pago?.estado || "pendiente"}
                    onChange={(e) => updateTramiteStatus(tramite.id, "pagoEstado", e.target.value)}
                    className={`px-2 py-0.5 rounded text-xs border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-0 ${tramite.pago?.estado === "confirmado"
                      ? "bg-green-100 text-green-700 focus:ring-green-300"
                      : tramite.pago?.estado === "devuelto"
                        ? "bg-gray-100 text-gray-700 focus:ring-gray-300"
                        : "bg-yellow-100 text-yellow-700 focus:ring-yellow-300"
                      }`}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Pagado</option>
                    <option value="devuelto">Devuelto</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Estado:</span>
                  <select
                    value={tramite.estado === "listo" ? "completado" : tramite.estado}
                    onChange={(e) => updateTramiteStatus(tramite.id, "estado", e.target.value)}
                    className={`px-2 py-0.5 rounded text-xs border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-0 ${tramite.estado === "listo" || tramite.estado === "completado"
                      ? "bg-green-100 text-green-700 focus:ring-green-300"
                      : tramite.estado === "rechazado"
                        ? "bg-red-100 text-red-700 focus:ring-red-300"
                        : tramite.estado === "cancelado"
                          ? "bg-gray-100 text-gray-700 focus:ring-gray-300"
                          : tramite.estado === "en_proceso"
                            ? "bg-blue-100 text-blue-700 focus:ring-blue-300"
                            : "bg-yellow-100 text-yellow-700 focus:ring-yellow-300"
                      }`}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="completado">Completado</option>
                    <option value="rechazado">Rechazado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Observaciones */}
              {(editingObsId === tramite.id || tramite.observaciones) && (
                <div className="mb-3">
                  {editingObsId === tramite.id ? (
                    <div className="flex flex-col gap-1">
                      <textarea
                        value={editingObsValue}
                        onChange={(e) => setEditingObsValue(e.target.value)}
                        rows={2}
                        placeholder="Observaciones..."
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveObservaciones(tramite.id)}
                          disabled={savingObs}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingObs ? "..." : "Guardar"}
                        </button>
                        <button
                          onClick={() => setEditingObsId(null)}
                          disabled={savingObs}
                          className="px-3 py-1 text-gray-600 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingObsId(tramite.id)
                        setEditingObsValue(tramite.observaciones || "")
                      }}
                      className="text-left text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 w-full"
                    >
                      {tramite.observaciones}
                    </button>
                  )}
                </div>
              )}

              {/* Link de pago */}
              {tieneLinkPago(tramite) && !tramite.pago?.paymentId && (
                <button
                  onClick={() => copiarLinkPagoLista(tramite.id)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-3"
                >
                  <LinkIcon className="w-3 h-3" />
                  Copiar link de pago
                </button>
              )}

              {/* Detalles MercadoPago */}
              {tramite.pago?.paymentId && (
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <p className="text-blue-800 text-xs font-medium mb-1">MercadoPago #{tramite.pago.paymentId}</p>
                  <div className="text-xs space-y-0.5">
                    {tramite.pago.payerName && <p className="text-blue-700">{tramite.pago.payerName}</p>}
                    {tramite.pago.payerEmail && <p className="text-blue-600">{tramite.pago.payerEmail}</p>}
                    {tramite.pago.payerDni && <p className="text-blue-500">DNI: {tramite.pago.payerDni}</p>}
                    {tramite.pago.paymentMethod && <p className="text-blue-500 capitalize">{tramite.pago.paymentMethod}</p>}
                    {tramite.pago.paymentDate && (
                      <p className="text-blue-400">
                        {new Date(tramite.pago.paymentDate).toLocaleDateString("es-AR")} {new Date(tramite.pago.paymentDate).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                <div className="relative">
                  <button
                    onClick={() => setActionMenuId(actionMenuId === tramite.id ? null : tramite.id)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Acciones"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {actionMenuId === tramite.id && (
                    <div ref={actionMenuRef} className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
                      <button
                        onClick={() => { openUploadModal(tramite); setActionMenuId(null) }}
                        className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${tramite.archivoUrl ? "text-green-600" : "text-gray-700"}`}
                      >
                        <Upload className="w-4 h-4" />
                        {tramite.archivoUrl ? "Documento cargado" : "Subir documento"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingObsId(tramite.id)
                          setEditingObsValue(tramite.observaciones || "")
                          setActionMenuId(null)
                        }}
                        className="w-full px-3 py-2.5 text-left text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50"
                      >
                        <StickyNote className="w-4 h-4" />
                        Observaciones
                      </button>
                      <Link
                        href={`/admin/tramites/${tramite.id}`}
                        onClick={() => setActionMenuId(null)}
                        className="w-full px-3 py-2.5 text-left text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50"
                      >
                        <Pencil className="w-4 h-4" />
                        Ver detalle
                      </Link>
                      <button
                        onClick={() => { setDeleteId(tramite.id); setActionMenuId(null) }}
                        className="w-full px-3 py-2.5 text-left text-sm text-red-600 flex items-center gap-2 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

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
              {filteredTramites.map((tramite) => (
                <tr key={tramite.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900 text-sm leading-tight">{tramite.user?.name ?? "Invitado"}</div>
                    <div className="text-gray-400 text-xs truncate max-w-[180px]">{tramite.user?.email ?? tramite.guestEmail}</div>
                    {getWhatsappNumber(tramite) && (
                      <button
                        onClick={() => openWhatsappModal(tramite)}
                        className="text-green-600 hover:text-green-700 text-xs flex items-center gap-1 mt-0.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {getWhatsappNumber(tramite)}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-gray-900 text-sm leading-tight">{tramite.tipoTramite}</div>
                    <div className="text-gray-400 text-xs">
                      {new Date(tramite.createdAt).toLocaleDateString("es-AR")} {new Date(tramite.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {tramite.partida ? (
                      <div className="text-xs space-y-0.5">
                        <div className="text-gray-900 font-medium">{tramite.partida.apellido}, {tramite.partida.nombres} {tramite.partida.sexo && <span className="text-gray-500 font-normal">({tramite.partida.sexo})</span>}</div>
                        {tramite.partida.dni && <div className="text-gray-500">DNI: {tramite.partida.dni}</div>}
                        {tramite.partida.fechaNacimiento && (
                          <div className="text-gray-500">Nac: {new Date(tramite.partida.fechaNacimiento).toLocaleDateString("es-AR")}</div>
                        )}
                        {tramite.partida.ciudadNacimiento && <div className="text-gray-400">{tramite.partida.ciudadNacimiento}</div>}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <select
                        value={tramite.pago?.estado || "pendiente"}
                        onChange={(e) => updateTramiteStatus(tramite.id, "pagoEstado", e.target.value)}
                        className={`px-2 py-0.5 rounded text-xs border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-0 ${tramite.pago?.estado === "confirmado"
                          ? "bg-green-100 text-green-700 focus:ring-green-300"
                          : tramite.pago?.estado === "devuelto"
                            ? "bg-gray-100 text-gray-700 focus:ring-gray-300"
                            : "bg-yellow-100 text-yellow-700 focus:ring-yellow-300"
                          }`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Pagado</option>
                        <option value="devuelto">Devuelto</option>
                      </select>
                    </div>
                    {tieneLinkPago(tramite) && !tramite.pago?.paymentId && (
                      <button
                        onClick={() => copiarLinkPagoLista(tramite.id)}
                        className="block text-[10px] text-blue-600 hover:text-blue-700 mt-0.5"
                      >
                        <LinkIcon className="w-3 h-3 inline mr-0.5" />Copiar link
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {tramite.pago?.paymentId ? (
                      <div className="text-xs space-y-0.5">
                        <div className="text-gray-900 font-medium">#{tramite.pago.paymentId}</div>
                        {tramite.pago.payerName && <div className="text-gray-600">{tramite.pago.payerName}</div>}
                        {tramite.pago.payerEmail && <div className="text-gray-500 truncate max-w-[160px]">{tramite.pago.payerEmail}</div>}
                        {tramite.pago.payerDni && <div className="text-gray-400">DNI: {tramite.pago.payerDni}</div>}
                        {tramite.pago.paymentMethod && <div className="text-gray-400 capitalize">{tramite.pago.paymentMethod}</div>}
                        {tramite.pago.paymentDate && (
                          <div className="text-gray-400">
                            {new Date(tramite.pago.paymentDate).toLocaleDateString("es-AR")} {new Date(tramite.pago.paymentDate).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={tramite.estado === "listo" ? "completado" : tramite.estado}
                      onChange={(e) => updateTramiteStatus(tramite.id, "estado", e.target.value)}
                      className={`px-2 py-0.5 rounded text-xs border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-0 ${tramite.estado === "listo" || tramite.estado === "completado"
                        ? "bg-green-100 text-green-700 focus:ring-green-300"
                        : tramite.estado === "rechazado"
                          ? "bg-red-100 text-red-700 focus:ring-red-300"
                          : tramite.estado === "cancelado"
                            ? "bg-gray-100 text-gray-700 focus:ring-gray-300"
                            : tramite.estado === "en_proceso"
                              ? "bg-blue-100 text-blue-700 focus:ring-blue-300"
                              : "bg-yellow-100 text-yellow-700 focus:ring-yellow-300"
                        }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="completado">Completado</option>
                      <option value="rechazado">Rechazado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {editingObsId === tramite.id ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          value={editingObsValue}
                          onChange={(e) => setEditingObsValue(e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveObservaciones(tramite.id)}
                            disabled={savingObs}
                            className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {savingObs ? "..." : "Guardar"}
                          </button>
                          <button
                            onClick={() => setEditingObsId(null)}
                            disabled={savingObs}
                            className="px-2 py-0.5 text-gray-600 text-[10px] border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingObsId(tramite.id)
                          setEditingObsValue(tramite.observaciones || "")
                        }}
                        className="text-left text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded px-2 py-1 w-full min-h-[24px]"
                        title="Click para editar observaciones"
                      >
                        {tramite.observaciones || "\u00A0"}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative flex justify-center">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === tramite.id ? null : tramite.id)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Acciones"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenuId === tramite.id && (
                        <div ref={actionMenuRef} className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
                          <button
                            onClick={() => { openUploadModal(tramite); setActionMenuId(null) }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${tramite.archivoUrl ? "text-green-600" : "text-gray-700"}`}
                          >
                            <Upload className="w-4 h-4" />
                            {tramite.archivoUrl ? "Documento cargado" : "Subir documento"}
                          </button>
                          <Link
                            href={`/admin/tramites/${tramite.id}`}
                            onClick={() => setActionMenuId(null)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50"
                          >
                            <Pencil className="w-4 h-4" />
                            Ver detalle
                          </Link>
                          <button
                            onClick={() => { setDeleteId(tramite.id); setActionMenuId(null) }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 flex items-center gap-2 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © 2024 Trámites Misiones - Todos los derechos reservados
          </p>
        </div>
      </footer>

      {/* Drawer de WhatsApp */}
      <Drawer open={!!whatsappTramite} onOpenChange={(open) => { if (!open) { setWhatsappTramite(null); setEditandoPlantillaId(null); setWhatsappLinkPago(null) } }}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center justify-between gap-2">
              <DrawerTitle>Enviar WhatsApp</DrawerTitle>
              {whatsappTramite && getWhatsappNumber(whatsappTramite) && (
                <a
                  href={generateWhatsAppLink(getWhatsappNumber(whatsappTramite)!, "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWhatsappTramite(null)}
                  className="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full hover:bg-green-700"
                  title="Abrir chat vacío"
                  aria-label="Abrir WhatsApp sin mensaje"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              )}
            </div>
            {whatsappTramite && (
              <DrawerDescription>
                Para: {whatsappTramite.partida?.nombres || whatsappTramite.user?.name || "Usuario"} - {getWhatsappNumber(whatsappTramite)}
              </DrawerDescription>
            )}
          </DrawerHeader>

          {whatsappTramite && plantillas.length > 0 ? (
            <div className="px-4">
              {editandoPlantillaId ? (
                <div className="mb-3">
                  <label className="text-gray-500 text-sm block mb-1">Editar mensaje de la plantilla &quot;{plantillaSeleccionada?.nombre}&quot;</label>
                  <p className="text-xs text-gray-400 mb-1">Variables: {"{nombre}"}, {"{apellido}"}, {"{nombreCompleto}"}, {"{dni}"}, {"{fechaNacimiento}"}, {"{ciudadNacimiento}"}, {"{tipo}"}, {"{monto}"}, {"{linkPago}"}, {"{fecha}"}</p>
                  <textarea
                    value={editMensaje}
                    onChange={(e) => setEditMensaje(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-y"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={guardarPlantilla}
                      disabled={savingPlantilla}
                      className="min-h-[44px] px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {savingPlantilla ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={cancelarEdicionPlantilla}
                      disabled={savingPlantilla}
                      className="min-h-[44px] px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="text-gray-500 text-sm">Plantilla</label>
                      {selectedTemplate !== "_blank" && (
                        <button
                          type="button"
                          onClick={iniciarEdicionPlantilla}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                          title="Editar plantilla"
                          aria-label="Editar plantilla"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="_blank">Sin mensaje (abrir chat vacío)</option>
                      {plantillas.map((p) => (
                        <option key={p.clave} value={p.clave}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {selectedTemplate !== "_blank" && (
                    <div>
                      <label className="text-gray-500 text-sm block mb-1">Vista previa</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                        {generarMensaje(selectedTemplate, whatsappTramite)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="px-4">
              <p className="text-sm text-gray-500">Cargando plantillas...</p>
            </div>
          )}

          <DrawerFooter>
            {whatsappTramite && getWhatsappNumber(whatsappTramite) && (
              <a
                href={generateWhatsAppLink(
                  getWhatsappNumber(whatsappTramite)!,
                  selectedTemplate === "_blank" ? "" : generarMensaje(selectedTemplate, whatsappTramite)
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWhatsappTramite(null)}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {selectedTemplate === "_blank" ? "Abrir WhatsApp" : "Enviar por WhatsApp"}
              </a>
            )}
            <button
              onClick={() => setWhatsappTramite(null)}
              className="min-h-[44px] px-4 py-3 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer: completar email del cliente al volver de crear trámite */}
      <Drawer open={!!creadoContactoTramiteId} onOpenChange={(open) => { if (!open) cerrarCreadoContacto() }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Datos del cliente</DrawerTitle>
            <DrawerDescription>
              Completá el email del cliente para que pueda iniciar sesión. El link de pago podés copiarlo abajo y enviarlo por el medio que prefieras.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            {creadoContactoLoading ? (
              <p className="text-sm text-gray-500 py-4">Cargando...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="creado-email" className="text-gray-700 text-sm block mb-1">Email del cliente</label>
                  <input
                    id="creado-email"
                    type="email"
                    value={creadoContactoForm.email}
                    onChange={(e) => {
                      creadoContactoFormEditado.current = true
                      setCreadoContactoForm((f) => ({ ...f, email: e.target.value }))
                    }}
                    placeholder="cliente@ejemplo.com"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                {creadoPaymentLink && (
                  <div>
                    <label className="text-gray-700 text-sm block mb-1">Link de pago (MercadoPago)</label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={creadoPaymentLink}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 truncate"
                        title={creadoPaymentLink}
                      />
                      <button
                        type="button"
                        onClick={copiarLinkPago}
                        className="min-h-[44px] px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 shrink-0"
                      >
                        {copiedLink ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enviá este link al cliente por WhatsApp para que pueda pagar.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DrawerFooter>
            <button
              onClick={guardarCreadoContacto}
              disabled={creadoContactoLoading || creadoContactoSaving}
              className="min-h-[44px] px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {creadoContactoSaving ? "Guardando..." : "Guardar y cerrar"}
            </button>
            <button
              onClick={cerrarCreadoContacto}
              disabled={creadoContactoSaving}
              className="min-h-[44px] px-4 py-3 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer de carga de documentos */}
      <Drawer open={!!uploadTramite} onOpenChange={(open) => { if (!open) setUploadTramite(null) }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Subir documento</DrawerTitle>
            {uploadTramite && (
              <DrawerDescription>
                Para: {uploadTramite.partida?.nombres} {uploadTramite.partida?.apellido} - {uploadTramite.tipoTramite}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="px-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto text-gray-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm text-gray-600 mb-3">
                {uploading ? "Subiendo archivo..." : "Subir archivo PDF para el usuario"}
              </p>
              {uploadError && (
                <p className="text-sm text-red-600 mb-3">{uploadError}</p>
              )}
              <label className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700">
                {uploading ? "Subiendo..." : "Seleccionar PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <DrawerFooter>
            <button
              onClick={() => setUploadTramite(null)}
              disabled={uploading}
              className="min-h-[44px] px-4 py-3 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Modal de confirmación de eliminación */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este trámite? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="min-h-[44px] inline-flex items-center px-4 py-3 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="min-h-[44px] inline-flex items-center px-4 py-3 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 active:bg-red-800 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
