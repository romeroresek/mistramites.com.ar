"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Home, FileText, LogOut, Pencil, Trash2, Users, FileStack, PlusCircle, Link as LinkIcon, RefreshCw } from "lucide-react"
import { useToast } from "@/components/Toast"
import { generateWhatsAppLink } from "@/lib/contactTemplates"
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
  user: { name: string; email: string } | null
  guestEmail: string | null
  whatsapp: string | null
  monto: number
  createdAt: string
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
  const [creadoContactoTramiteId, setCreadoContactoTramiteId] = useState<string | null>(null)
  const [creadoContactoForm, setCreadoContactoForm] = useState({ email: "", whatsapp: "" })
  const [creadoContactoLoading, setCreadoContactoLoading] = useState(false)
  const [creadoContactoSaving, setCreadoContactoSaving] = useState(false)
  const [creadoPaymentLink, setCreadoPaymentLink] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

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

  // Sincroniza estado de pago con MercadoPago (pendientes → aprobado, confirmados → devuelto si hubo reembolso)
  const verifyPaymentsWithMp = async (tramitesList: Tramite[]) => {
    if (!Array.isArray(tramitesList)) return
    const conPago = tramitesList.filter(
      (t) => (t.pago?.estado === "pendiente" || t.pago?.estado === "confirmado") && (t.pago?.mercadopagoId || t.pago?.paymentId)
    )
    if (conPago.length === 0) return

    let updated = false
    for (const tramite of conPago) {
      try {
        const res = await fetch("/api/mercadopago/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tramiteId: tramite.id }),
        })
        const data = await res.json()
        if (data.pagoEstado && data.pagoEstado !== tramite.pago?.estado) {
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

  const fetchPlantillas = async () => {
    try {
      const res = await fetch("/api/admin/plantillas")
      if (!res.ok) return
      const data = await res.json()
      setPlantillas(data)
      if (data.length > 0) setSelectedTemplate(data[0].clave)
    } catch (error) {
      console.error(error)
    }
  }

  const generarMensaje = (plantillaClave: string, tramite: Tramite): string => {
    const plantilla = plantillas.find(p => p.clave === plantillaClave)
    if (!plantilla) return ""
    const nombre = tramite.partida?.nombres || tramite.user?.name || "Usuario"
    const tipo = tramite.tipoTramite
    const monto = tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })
    return plantilla.mensaje
      .replace(/\{nombre\}/g, nombre)
      .replace(/\{tipo\}/g, tipo)
      .replace(/\{monto\}/g, monto)
  }

  const getWhatsappNumber = (tramite: Tramite): string | null =>
    tramite.whatsapp || tramite.partida?.whatsapp || null

  const getLinkPago = (tramite: Tramite): string | null =>
    tramite.pago?.estado === "pendiente" && tramite.pago?.mercadopagoId
      ? `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${tramite.pago.mercadopagoId}`
      : null

  const copiarLinkPagoLista = (url: string) => {
    navigator.clipboard.writeText(url).then(() => toast.showSuccess("Link copiado al portapapeles"))
  }

  const openWhatsappModal = (tramite: Tramite) => {
    setWhatsappTramite(tramite)
    setEditandoPlantillaId(null)
    if (plantillas.length > 0) setSelectedTemplate(plantillas[0].clave)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch/verify solo al montar o cambiar sesión
  }, [status, session, router])

  // Toast, drawer de contacto y limpieza de URL cuando vuelve de crear un trámite
  const creadoToastShown = useRef(false)
  useEffect(() => {
    const creado = searchParams.get("creado")
    if (creado !== "1" || creadoToastShown.current) return
    creadoToastShown.current = true
    const tramiteId = searchParams.get("tramiteId")
    const initPoint = searchParams.get("initPoint")
    if (initPoint) {
      toast.showSuccess("Trámite creado. Completá email y WhatsApp del cliente para que pueda iniciar sesión y recibir el link de pago.")
    } else {
      toast.showSuccess("Trámite creado. Completá email y WhatsApp del cliente para que pueda iniciar sesión.")
    }
    if (tramiteId) setCreadoContactoTramiteId(tramiteId)
    if (initPoint) setCreadoPaymentLink(initPoint)
    fetchTramites()
    router.replace("/admin", { scroll: false })
  }, [searchParams, router, toast])

  // Al abrir el drawer de contacto, cargar datos del trámite
  useEffect(() => {
    if (!creadoContactoTramiteId) return
    setCreadoContactoLoading(true)
    fetch(`/api/admin/tramites/${creadoContactoTramiteId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((t: Tramite | null) => {
        if (t) {
          setCreadoContactoForm({
            email: t.guestEmail || t.user?.email || "",
            whatsapp: t.whatsapp || t.partida?.whatsapp || "",
          })
          setCreadoPaymentLink((prev) => prev || (t.pago?.mercadopagoId ? `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${t.pago.mercadopagoId}` : null))
        }
      })
      .catch(() => {})
      .finally(() => setCreadoContactoLoading(false))
  }, [creadoContactoTramiteId])

  const guardarCreadoContacto = async () => {
    if (!creadoContactoTramiteId) return
    setCreadoContactoSaving(true)
    try {
      const res = await fetch(`/api/admin/tramites/${creadoContactoTramiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestEmail: creadoContactoForm.email || null,
          whatsapp: creadoContactoForm.whatsapp || null,
        }),
      })
      if (res.ok) {
        await fetchTramites()
        setCreadoContactoTramiteId(null)
        setCreadoPaymentLink(null)
      }
    } catch (error) {
      console.error(error)
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
        className={`fixed top-0 right-0 h-auto max-h-[90vh] w-56 bg-white shadow-lg border border-gray-200 rounded-bl-lg z-50 transform transition-transform duration-200 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
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
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Panel de Administrador</h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                setRefreshing(true)
                const list = await fetchTramites()
                await verifyPaymentsWithMp(Array.isArray(list) ? list : tramites)
                setRefreshing(false)
                toast.showSuccess("Lista actualizada con MercadoPago")
              }}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60"
              title="Actualizar lista (p. ej. tras devoluciones en MercadoPago)"
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
        {tramites.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">No hay trámites registrados.</p>
          </div>
        )}

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {tramites.map((tramite) => (
            <div key={tramite.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="font-medium text-gray-900 text-sm truncate">{tramite.tipoTramite}</p>
              <p className="text-sm text-gray-400 mb-2">
                Fecha Pedido: {new Date(tramite.createdAt).toLocaleDateString("es-AR")} {new Date(tramite.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </p>
              {tramite.partida && (
                <div className="mb-2">
                  {tramite.partida.dni && <p className="text-sm text-gray-500 truncate">DNI: {tramite.partida.dni}</p>}
                  <p className="text-sm text-gray-700 truncate">{tramite.partida.apellido}, {tramite.partida.nombres}</p>
                  {tramite.partida.ciudadNacimiento && <p className="text-sm text-gray-400 truncate">{tramite.partida.ciudadNacimiento}</p>}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm mb-2">
                <span className="text-gray-900">Pago:</span>
                <select
                  value={tramite.pago?.estado || "pendiente"}
                  onChange={(e) => updateTramiteStatus(tramite.id, "pagoEstado", e.target.value)}
                  className={`text-sm px-2 py-1 rounded border border-gray-200 cursor-pointer focus:outline-none ${
                    tramite.pago?.estado === "confirmado"
                      ? "text-green-600"
                      : tramite.pago?.estado === "devuelto"
                      ? "text-gray-500"
                      : "text-yellow-600"
                  }`}
                >
                  <option value="pendiente">pendiente</option>
                  <option value="confirmado">confirmado</option>
                  <option value="devuelto">devuelto</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="text-gray-900">Trámite:</span>
                <select
                  value={tramite.estado === "listo" ? "completado" : tramite.estado}
                  onChange={(e) => updateTramiteStatus(tramite.id, "estado", e.target.value)}
                  className={`text-sm px-2 py-1 rounded border border-gray-200 cursor-pointer focus:outline-none ${
                    tramite.estado === "listo" || tramite.estado === "completado"
                      ? "text-green-600"
                      : tramite.estado === "rechazado"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  <option value="pendiente">pendiente</option>
                  <option value="en_proceso">en proceso</option>
                  <option value="completado">Completado</option>
                  <option value="rechazado">rechazado</option>
                </select>
              </div>
              {tramite.pago?.payerEmail ? (
                <div className="text-sm bg-blue-50 rounded-lg p-3 mb-2">
                  <div className="font-medium text-blue-800">Pagador MP:</div>
                  <div className="text-blue-600">{tramite.pago.payerName || "-"}</div>
                  <div className="text-blue-500">{tramite.pago.payerEmail}</div>
                  {tramite.pago.payerDni && <div className="text-blue-400">DNI: {tramite.pago.payerDni}</div>}
                  {tramite.pago.paymentId && <div className="text-blue-400">ID: {tramite.pago.paymentId}</div>}
                </div>
              ) : getLinkPago(tramite) && (
                <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                  <button
                    type="button"
                    onClick={() => copiarLinkPagoLista(getLinkPago(tramite)!)}
                    className="inline-flex items-center gap-2 text-amber-800 hover:text-amber-900 font-medium"
                    title="Copiar link de pago"
                    aria-label="Copiar link de pago"
                  >
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <span>Copiar link de pago</span>
                  </button>
                </div>
              )}
              <div className="flex justify-end gap-1.5 pt-1.5 mt-1.5 border-t border-gray-100">
                {getWhatsappNumber(tramite) && (
                  <button
                    onClick={() => openWhatsappModal(tramite)}
                    className="inline-flex items-center justify-center p-1.5 text-green-600 hover:text-green-800 rounded-md hover:bg-green-50"
                    title="Enviar WhatsApp"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                )}
                <Link
                  href={`/admin/tramites/${tramite.id}`}
                  className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setDeleteId(tramite.id)}
                  className="inline-flex items-center justify-center p-1.5 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Usuario</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Trámite</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pago</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pagador MP</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Monto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tramites.map((tramite, index) => (
                <tr key={tramite.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>
                      <span className="font-medium">{tramite.user?.name ?? "Invitado"}</span>
                      <div className="text-gray-500 text-xs">{tramite.user?.email ?? tramite.guestEmail}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{tramite.tipoTramite}</div>
                    <div className="text-xs text-gray-500">{tramite.oficina}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(tramite.createdAt).toLocaleDateString("es-AR")} {new Date(tramite.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={tramite.pago?.estado || "pendiente"}
                      onChange={(e) => updateTramiteStatus(tramite.id, "pagoEstado", e.target.value)}
                      className={`px-2 py-1 rounded text-xs border border-gray-200 cursor-pointer focus:outline-none ${
                        tramite.pago?.estado === "confirmado"
                          ? "bg-green-100 text-green-700"
                          : tramite.pago?.estado === "devuelto"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmado">Pagado</option>
                      <option value="devuelto">Devuelto</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={tramite.estado === "listo" ? "completado" : tramite.estado}
                      onChange={(e) => updateTramiteStatus(tramite.id, "estado", e.target.value)}
                      className={`px-2 py-1 rounded text-xs border border-gray-200 cursor-pointer focus:outline-none ${
                        tramite.estado === "listo" || tramite.estado === "completado"
                          ? "bg-green-100 text-green-700"
                          : tramite.estado === "rechazado"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="completado">Completado</option>
                      <option value="rechazado">Rechazado</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {tramite.pago?.payerEmail ? (
                      <div>
                        <div className="font-medium text-xs">{tramite.pago.payerName || "-"}</div>
                        <div className="text-xs text-gray-500">{tramite.pago.payerEmail}</div>
                        {tramite.pago.payerDni && (
                          <div className="text-xs text-gray-400">DNI: {tramite.pago.payerDni}</div>
                        )}
                        {tramite.pago.paymentId && (
                          <div className="text-xs text-blue-500">ID: {tramite.pago.paymentId}</div>
                        )}
                      </div>
                    ) : getLinkPago(tramite) ? (
                      <button
                        type="button"
                        onClick={() => copiarLinkPagoLista(getLinkPago(tramite)!)}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                        title="Copiar link de pago"
                        aria-label="Copiar link de pago"
                      >
                        <LinkIcon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium">Copiar</span>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      {getWhatsappNumber(tramite) && (
                        <button
                          onClick={() => openWhatsappModal(tramite)}
                          className="text-green-600 hover:text-green-800"
                          title="Enviar WhatsApp"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </button>
                      )}
                      <Link
                        href={`/admin/tramites/${tramite.id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => setDeleteId(tramite.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
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
      <Drawer open={!!whatsappTramite} onOpenChange={(open) => { if (!open) { setWhatsappTramite(null); setEditandoPlantillaId(null) } }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Enviar WhatsApp</DrawerTitle>
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
                  <p className="text-xs text-gray-400 mb-1">Variables: {"{nombre}"}, {"{tipo}"}, {"{monto}"}</p>
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
                      <button
                        type="button"
                        onClick={iniciarEdicionPlantilla}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                        title="Editar plantilla"
                        aria-label="Editar plantilla"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    >
                      {plantillas.map((p) => (
                        <option key={p.clave} value={p.clave}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-500 text-sm block mb-1">Vista previa</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                      {generarMensaje(selectedTemplate, whatsappTramite)}
                    </div>
                  </div>
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
                  generarMensaje(selectedTemplate, whatsappTramite)
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWhatsappTramite(null)}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar por WhatsApp
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

      {/* Drawer: completar email y WhatsApp del cliente al volver de crear trámite */}
      <Drawer open={!!creadoContactoTramiteId} onOpenChange={(open) => { if (!open) cerrarCreadoContacto() }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Datos del cliente</DrawerTitle>
            <DrawerDescription>
              Completá el email y WhatsApp del cliente para que pueda iniciar sesión y recibir el link de pago por WhatsApp.
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
                    onChange={(e) => setCreadoContactoForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="cliente@ejemplo.com"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="creado-whatsapp" className="text-gray-700 text-sm block mb-1">WhatsApp del cliente</label>
                  <input
                    id="creado-whatsapp"
                    type="tel"
                    value={creadoContactoForm.whatsapp}
                    onChange={(e) => setCreadoContactoForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    placeholder="Ej: 3764123456"
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
