"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Undo2 } from "lucide-react"

interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  descripcion: string | null
  monto: number
  archivoUrl: string | null
  createdAt: string
  updatedAt: string
  user: { name: string; email: string } | null
  guestEmail: string | null
  whatsapp: string | null
  pago?: {
    id: string
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
    dni: string
    sexo: string
    nombres: string
    apellido: string
    fechaNacimiento: string
    ciudadNacimiento: string | null
    fechaDefuncion: string | null
    dni2: string | null
    sexo2: string | null
    nombres2: string | null
    apellido2: string | null
    fechaNacimiento2: string | null
    fechaMatrimonio: string | null
    ciudadMatrimonio: string | null
    divorciados: boolean
    whatsapp: string | null
    apostillado: boolean
  }
}

const estadoOptions = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "completado", label: "Completado" },
  { value: "rechazado", label: "Rechazado" },
  { value: "cancelado", label: "Cancelado" },
]

export default function AdminTramiteDetalle() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [tramite, setTramite] = useState<Tramite | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editMonto, setEditMonto] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refunding, setRefunding] = useState(false)
  const [refundError, setRefundError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [showPagoDropdown, setShowPagoDropdown] = useState(false)
  const [editPartida, setEditPartida] = useState(false)
  const [partidaForm, setPartidaForm] = useState({
    dni: "",
    sexo: "",
    apellido: "",
    nombres: "",
    fechaNacimiento: "",
    ciudadNacimiento: "",
  })
  const [editContacto, setEditContacto] = useState(false)
  const [contactoForm, setContactoForm] = useState({ email: "", whatsapp: "" })
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedLinkPago, setCopiedLinkPago] = useState(false)
  const [linkPagoReal, setLinkPagoReal] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const tieneLinkPago =
    tramite?.pago?.estado === "pendiente" && !!tramite.pago?.mercadopagoId

  // Obtener el link real desde la API de MercadoPago
  useEffect(() => {
    if (!tieneLinkPago || !params.id) return
    let cancelled = false
    fetch(`/api/admin/tramites/${params.id}/link-pago`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { initPoint?: string } | null) => {
        if (!cancelled && data?.initPoint) setLinkPagoReal(data.initPoint)
      })
      .catch(() => { })
    return () => { cancelled = true }
  }, [tieneLinkPago, params.id])

  const linkPagoMostrar = linkPagoReal || (tieneLinkPago && tramite?.pago?.mercadopagoId
    ? `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${tramite.pago.mercadopagoId}`
    : null)

  const copiarLinkPago = async () => {
    if (!tieneLinkPago) return
    const fallback = tramite?.pago?.mercadopagoId
      ? `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${tramite.pago!.mercadopagoId}`
      : ""
    try {
      if (linkPagoReal) {
        await navigator.clipboard.writeText(linkPagoReal)
      } else {
        const res = await fetch(`/api/admin/tramites/${params.id}/link-pago`)
        if (res.ok) {
          const { initPoint } = await res.json()
          if (initPoint) {
            await navigator.clipboard.writeText(initPoint)
            setLinkPagoReal(initPoint)
          } else if (fallback) {
            await navigator.clipboard.writeText(fallback)
          }
        } else if (fallback) {
          await navigator.clipboard.writeText(fallback)
        }
      }
      setCopiedLinkPago(true)
      setTimeout(() => setCopiedLinkPago(false), 2000)
    } catch {
      if (fallback) {
        await navigator.clipboard.writeText(fallback)
        setCopiedLinkPago(true)
        setTimeout(() => setCopiedLinkPago(false), 2000)
      }
    }
  }

  const fetchTramite = async (): Promise<Tramite | null> => {
    try {
      const res = await fetch(`/api/admin/tramites/${params.id}`)
      if (!res.ok) throw new Error("No encontrado")
      const data = await res.json()
      setTramite(data)
      return data
    } catch (error) {
      console.error(error)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.push("/login"); return }
    if (session?.user?.role !== "admin") { router.push("/"); return }

    fetchTramite().then((t) => {
      // Solo verificar con MP si el trámite tiene pago con mercadopagoId o paymentId
      if (t?.pago && (t.pago.mercadopagoId || t.pago.paymentId) && t.pago.estado !== "devuelto") {
        fetch("/api/mercadopago/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tramiteId: params.id,
            paymentId: t.pago.paymentId || undefined,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.updated) fetchTramite()
          })
          .catch(() => { })
      }
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch solo al montar o cambiar id/sesión
  }, [status, session, router, params.id])

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!tramite) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (res.ok) {
        const data = await res.json()
        setTramite(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  const handlePagoEstadoChange = async (nuevoEstado: string) => {
    if (!tramite) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagoEstado: nuevoEstado }),
      })
      if (res.ok) {
        const data = await res.json()
        setTramite(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  const handleRefund = async () => {
    if (!tramite) return
    setRefunding(true)
    setRefundError("")
    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}/refund`, {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok && data.tramite) {
        setTramite(data.tramite)
        setShowRefundModal(false)
      } else {
        setRefundError(data?.error || "Error al procesar la devolución")
      }
    } catch {
      setRefundError("Error de conexión al procesar la devolución")
    } finally {
      setRefunding(false)
    }
  }

  const handleMontoSave = async () => {
    if (!tramite || !editMonto) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: parseFloat(editMonto) }),
      })
      if (res.ok) {
        const data = await res.json()
        setTramite(data)
        setEditMode(false)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!tramite) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        router.push("/admin")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  const startEdit = () => {
    if (tramite) {
      setEditMonto(tramite.monto.toString())
      setEditMode(true)
    }
  }

  const startPartidaEdit = () => {
    if (tramite?.partida) {
      setPartidaForm({
        dni: tramite.partida.dni,
        sexo: tramite.partida.sexo,
        apellido: tramite.partida.apellido,
        nombres: tramite.partida.nombres,
        fechaNacimiento: tramite.partida.fechaNacimiento.split("T")[0],
        ciudadNacimiento: tramite.partida.ciudadNacimiento || "",
      })
      setEditPartida(true)
    }
  }

  const handlePartidaSave = async () => {
    if (!tramite) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partida: partidaForm }),
      })
      if (res.ok) {
        const data = await res.json()
        setTramite(data)
        setEditPartida(false)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  const startContactoEdit = () => {
    if (tramite) {
      setContactoForm({
        email: tramite.guestEmail || tramite.user?.email || "",
        whatsapp: tramite.whatsapp || tramite.partida?.whatsapp || "",
      })
      setEditContacto(true)
    }
  }

  const handleContactoSave = async () => {
    if (!tramite) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestEmail: contactoForm.email, whatsapp: contactoForm.whatsapp }),
      })
      if (res.ok) {
        const data = await res.json()
        setTramite(data)
        setEditContacto(false)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tramite) return

    if (file.type !== "application/pdf") {
      setUploadError("Solo se permiten archivos PDF")
      return
    }

    setUploading(true)
    setUploadError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}/upload`, {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setTramite({ ...tramite, archivoUrl: data.archivoUrl })
      } else {
        const error = await res.json()
        setUploadError(error.error || "Error al subir archivo")
      }
    } catch (error) {
      console.error(error)
      setUploadError("Error al subir archivo")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleFileDelete = async () => {
    if (!tramite) return
    setUploading(true)

    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}/upload`, {
        method: "DELETE",
      })

      if (res.ok) {
        setTramite({ ...tramite, archivoUrl: null })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!tramite) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded p-6 text-center max-w-md w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trámite no encontrado</h2>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm">
            Volver al panel
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-2">
            <Link
              href="/admin"
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
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Menú Admin</span>
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
          <Link
            href="/mis-tramites"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            Mis Trámites
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

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto px-5 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4">
        <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Detalle del trámite</h1>

        {/* Info general */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{tramite.tipoTramite}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Oficina</span>
              <p className="font-medium text-gray-900">{tramite.oficina}</p>
            </div>
            <div>
              <span className="text-gray-500">Usuario</span>
              <p className="font-medium text-gray-900">{tramite.user?.name || "Invitado"}</p>
              <p className="text-gray-500 text-xs break-all">{tramite.guestEmail || tramite.user?.email}</p>
            </div>
            <div>
              <span className="text-gray-500">Monto</span>
              {editMode ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={editMonto}
                    onChange={(e) => setEditMonto(e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                  />
                  <button
                    onClick={handleMontoSave}
                    disabled={updating}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">
                    ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </p>
                  <button
                    onClick={startEdit}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
            <div>
              <div className="text-gray-500">Pago</div>
              <div className="mt-1 relative inline-block">
                <button
                  onClick={() => setShowPagoDropdown(!showPagoDropdown)}
                  disabled={updating}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 ${tramite.pago?.estado === "confirmado"
                    ? "bg-green-500 text-white"
                    : tramite.pago?.estado === "devuelto"
                      ? "bg-gray-500 text-white"
                      : "bg-yellow-500 text-white"
                    }`}
                >
                  {tramite.pago?.estado === "confirmado" ? "Pagado" : tramite.pago?.estado === "devuelto" ? "Devuelto" : "Pendiente"}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {showPagoDropdown && (
                  <div className="absolute left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[140px]">
                    <button
                      onClick={() => { handlePagoEstadoChange("pendiente"); setShowPagoDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      Pendiente
                    </button>
                    <button
                      onClick={() => { handlePagoEstadoChange("confirmado"); setShowPagoDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      Pagado
                    </button>
                    <button
                      onClick={() => { handlePagoEstadoChange("devuelto"); setShowPagoDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                      Devuelto
                    </button>
                  </div>
                )}
              </div>
            </div>
                        <div>
              <span className="text-gray-500">Creado</span>
              <p className="font-medium text-gray-900">{formatDate(tramite.createdAt)}</p>
            </div>
            <div>
              <span className="text-gray-500">Actualizado</span>
              <p className="font-medium text-gray-900">{formatDate(tramite.updatedAt)}</p>
            </div>
          </div>

          {tramite.descripcion && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-gray-500 text-sm">Descripción</span>
              <p className="text-gray-900 text-sm">{tramite.descripcion}</p>
            </div>
          )}

          {/* Apostillado */}
          {tramite.partida?.apostillado && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-sm font-medium text-indigo-700">Apostillado de La Haya solicitado</span>
              </div>
            </div>
          )}
        </div>

        {/* Pago pendiente - Link de pago */}
        {tieneLinkPago && linkPagoMostrar && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h3 className="text-base font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Pago Pendiente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="sm:col-span-2">
                <span className="text-yellow-700">Link de pago (MercadoPago)</span>
                <div className="flex gap-2 flex-wrap mt-1">
                  <input
                    readOnly
                    value={linkPagoMostrar}
                    className="flex-1 min-w-0 px-3 py-2 border border-yellow-300 rounded text-sm bg-yellow-50 truncate text-yellow-900"
                    title={linkPagoMostrar}
                  />
                  <button
                    type="button"
                    onClick={copiarLinkPago}
                    className="px-3 py-2 text-sm font-medium text-yellow-700 border border-yellow-400 rounded hover:bg-yellow-100 shrink-0"
                  >
                    {copiedLinkPago ? "Copiado" : "Copiar link"}
                  </button>
                </div>
                <p className="text-xs text-yellow-600 mt-1">Enviá este link al cliente por WhatsApp para que pueda pagar.</p>
              </div>
            </div>
          </div>
        )}

        {/* Detalles de MercadoPago */}
        {tramite.pago?.paymentId && (
          <div className={`rounded p-4 border ${tramite.pago?.estado === "devuelto" ? "bg-gray-100 border-gray-300" : "bg-blue-50 border-blue-200"}`}>
            <h3 className={`text-base font-semibold mb-3 flex items-center gap-2 ${tramite.pago?.estado === "devuelto" ? "text-gray-700" : "text-blue-900"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Detalles de MercadoPago{tramite.pago?.estado === "devuelto" && <span className="text-gray-500 font-normal text-sm">(devuelto)</span>}
              {tramite.pago?.estado === "confirmado" && (
                <button
                  type="button"
                  onClick={() => { setRefundError(""); setShowRefundModal(true) }}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-600 transition-colors text-xs font-medium"
                  title="Devolver pago"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Devolver pago
                </button>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className={tramite.pago?.estado === "devuelto" ? "text-gray-600" : "text-blue-600"}>Nº de Operación</span>
                <p className={`font-semibold ${tramite.pago?.estado === "devuelto" ? "text-gray-800" : "text-blue-900"}`}>#{tramite.pago.paymentId}</p>
              </div>
              {tramite.pago.payerName && (
                <div>
                  <span className={tramite.pago?.estado === "devuelto" ? "text-gray-600" : "text-blue-600"}>Nombre del pagador</span>
                  <p className={`font-medium ${tramite.pago?.estado === "devuelto" ? "text-gray-800" : "text-blue-900"}`}>{tramite.pago.payerName}</p>
                </div>
              )}
              {tramite.pago.payerEmail && (
                <div>
                  <span className={tramite.pago?.estado === "devuelto" ? "text-gray-600" : "text-blue-600"}>Email del pagador</span>
                  <p className={`font-medium break-all ${tramite.pago?.estado === "devuelto" ? "text-gray-800" : "text-blue-900"}`}>{tramite.pago.payerEmail}</p>
                </div>
              )}
              {tramite.pago.payerDni && (
                <div>
                  <span className={tramite.pago?.estado === "devuelto" ? "text-gray-600" : "text-blue-600"}>DNI del pagador</span>
                  <p className={`font-medium ${tramite.pago?.estado === "devuelto" ? "text-gray-800" : "text-blue-900"}`}>{tramite.pago.payerDni}</p>
                </div>
              )}
              {tramite.pago.paymentMethod && (
                <div>
                  <span className={tramite.pago?.estado === "devuelto" ? "text-gray-600" : "text-blue-600"}>Método de pago</span>
                  <p className={`font-medium capitalize ${tramite.pago?.estado === "devuelto" ? "text-gray-800" : "text-blue-900"}`}>{tramite.pago.paymentMethod}</p>
                </div>
              )}
              {tramite.pago.paymentDate && (
                <div>
                  <span className={tramite.pago?.estado === "devuelto" ? "text-gray-600" : "text-blue-600"}>Fecha y hora del pago</span>
                  <p className={`font-medium ${tramite.pago?.estado === "devuelto" ? "text-gray-800" : "text-blue-900"}`}>
                    {new Date(tramite.pago.paymentDate).toLocaleDateString("es-AR")} {new Date(tramite.pago.paymentDate).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado del trámite */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Estado del trámite</h3>
          <div className="flex flex-wrap gap-2">
            {estadoOptions.map((opt) => {
              const isSelected = opt.value === "completado"
                ? (tramite.estado === "completado" || tramite.estado === "listo")
                : tramite.estado === opt.value
              const isDisabled = updating || isSelected
              return (
                <button
                  key={opt.value}
                  onClick={() => handleEstadoChange(opt.value)}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 rounded text-xs font-medium ${isSelected
                    ? opt.value === "completado" ? "bg-green-600 text-white"
                      : opt.value === "rechazado" ? "bg-red-600 text-white"
                        : opt.value === "cancelado" ? "bg-gray-600 text-white"
                          : opt.value === "en_proceso" ? "bg-blue-600 text-white"
                            : "bg-yellow-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } disabled:cursor-not-allowed`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Archivo PDF */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Documento PDF</h3>

          {tramite.archivoUrl ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1zm0 2h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1zm0 2h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Archivo adjunto</p>
                  <p className="text-xs text-gray-500">PDF disponible para descarga</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={tramite.archivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Ver PDF
                </a>
                <button
                  onClick={handleFileDelete}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {uploading ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center">
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
              <label className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded cursor-pointer hover:bg-blue-700">
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
          )}
        </div>

        {/* Datos de la partida */}
        {tramite.partida && (
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-gray-900">Datos de la partida</h3>
              {!editPartida && (
                <button
                  onClick={startPartidaEdit}
                  className="text-blue-600 hover:text-blue-800"
                  title="Editar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>

            {editPartida ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">DNI</label>
                    <input
                      type="text"
                      value={partidaForm.dni}
                      onChange={(e) => setPartidaForm({ ...partidaForm, dni: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">Sexo</label>
                    <select
                      value={partidaForm.sexo}
                      onChange={(e) => setPartidaForm({ ...partidaForm, sexo: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">Apellido</label>
                    <input
                      type="text"
                      value={partidaForm.apellido}
                      onChange={(e) => setPartidaForm({ ...partidaForm, apellido: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">Nombres</label>
                    <input
                      type="text"
                      value={partidaForm.nombres}
                      onChange={(e) => setPartidaForm({ ...partidaForm, nombres: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={partidaForm.fechaNacimiento}
                      onChange={(e) => setPartidaForm({ ...partidaForm, fechaNacimiento: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={partidaForm.ciudadNacimiento}
                      onChange={(e) => setPartidaForm({ ...partidaForm, ciudadNacimiento: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handlePartidaSave}
                    disabled={updating}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {updating ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    onClick={() => setEditPartida(false)}
                    disabled={updating}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">DNI</span>
                  <p className="font-medium text-gray-900">{tramite.partida.dni}</p>
                </div>
                <div>
                  <span className="text-gray-500">Sexo</span>
                  <p className="font-medium text-gray-900">{tramite.partida.sexo === "M" ? "Masculino" : "Femenino"}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Apellido y nombre</span>
                  <p className="font-medium text-gray-900">{tramite.partida.apellido} {tramite.partida.nombres}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fecha de nacimiento</span>
                  <p className="font-medium text-gray-900">{formatDate(tramite.partida.fechaNacimiento)}</p>
                </div>
                {tramite.partida.ciudadNacimiento && (
                  <div>
                    <span className="text-gray-500">Ciudad</span>
                    <p className="font-medium text-gray-900">{tramite.partida.ciudadNacimiento}</p>
                  </div>
                )}
                {tramite.partida.fechaDefuncion && (
                  <div>
                    <span className="text-gray-500">Fecha de defunción</span>
                    <p className="font-medium text-gray-900">{formatDate(tramite.partida.fechaDefuncion)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Persona 2 (matrimonio) */}
            {tramite.partida.tipoPartida === "matrimonio" && tramite.partida.dni2 && (
              <>
                <hr className="my-4 border-gray-200" />
                <h4 className="font-medium text-gray-900 mb-3 text-sm">Segunda persona</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">DNI</span>
                    <p className="font-medium text-gray-900">{tramite.partida.dni2}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sexo</span>
                    <p className="font-medium text-gray-900">{tramite.partida.sexo2 === "M" ? "Masculino" : "Femenino"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Apellido y nombre</span>
                    <p className="font-medium text-gray-900">{tramite.partida.apellido2} {tramite.partida.nombres2}</p>
                  </div>
                  {tramite.partida.fechaNacimiento2 && (
                    <div>
                      <span className="text-gray-500">Fecha de nacimiento</span>
                      <p className="font-medium text-gray-900">{formatDate(tramite.partida.fechaNacimiento2)}</p>
                    </div>
                  )}
                </div>

                <hr className="my-4 border-gray-200" />
                <h4 className="font-medium text-gray-900 mb-3 text-sm">Datos del matrimonio</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {tramite.partida.fechaMatrimonio && (
                    <div>
                      <span className="text-gray-500">Fecha de matrimonio</span>
                      <p className="font-medium text-gray-900">{formatDate(tramite.partida.fechaMatrimonio)}</p>
                    </div>
                  )}
                  {tramite.partida.ciudadMatrimonio && (
                    <div>
                      <span className="text-gray-500">Ciudad</span>
                      <p className="font-medium text-gray-900">{tramite.partida.ciudadMatrimonio}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Divorciados</span>
                    <p className="font-medium text-gray-900">{tramite.partida.divorciados ? "Sí" : "No"}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sección de Contacto */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-900">Contacto</h3>
            {!editContacto && (
              <button
                onClick={startContactoEdit}
                className="text-blue-600 hover:text-blue-800"
                title="Editar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>

          {editContacto ? (
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-sm block mb-1">Email</label>
                  <input
                    type="email"
                    value={contactoForm.email}
                    onChange={(e) => setContactoForm({ ...contactoForm, email: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-sm block mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={contactoForm.whatsapp}
                    onChange={(e) => setContactoForm({ ...contactoForm, whatsapp: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleContactoSave}
                  disabled={updating}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => setEditContacto(false)}
                  disabled={updating}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-gray-500 text-sm">Email</span>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium text-gray-900 text-sm break-all">
                    {tramite.guestEmail || tramite.user?.email || "No disponible"}
                  </p>
                  {(tramite.guestEmail || tramite.user?.email) && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tramite.guestEmail || tramite.user?.email || "")
                        setCopiedEmail(true)
                        setTimeout(() => setCopiedEmail(false), 2000)
                      }}
                      className="text-blue-600 hover:text-blue-800"
                      title="Copiar email"
                    >
                      {copiedEmail ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">WhatsApp</span>
                <p className="font-medium text-gray-900 text-sm mt-1">
                  {tramite.whatsapp || tramite.partida?.whatsapp || "No disponible"}
                </p>
              </div>
            </div>
          )}

          {!(tramite.whatsapp || tramite.partida?.whatsapp) && (
            <p className="text-gray-500 text-sm italic">
              No hay número de WhatsApp registrado para este trámite.
            </p>
          )}
        </div>

        {/* Zona de peligro */}
        <div className="bg-white border border-gray-200 rounded p-4 border-l-4 border-l-red-500">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Zona de peligro</h3>
          <p className="text-gray-600 text-sm mb-4">
            Eliminar este trámite eliminará permanentemente todos los datos asociados.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Eliminar trámite
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © {new Date().getFullYear()} Trámites Misiones - Todos los derechos reservados
          </p>
        </div>
      </footer>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded p-6 max-w-md w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este trámite? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Confirmar devolución</h3>
            <p className="text-sm text-gray-600 mb-2">
              Se procesará la <strong>devolución total</strong> del pago{" "}
              <span className="font-mono text-gray-800">#{tramite?.pago?.paymentId}</span> a través de Mercado Pago.
            </p>
            <p className="text-xs text-gray-500 mb-5">
              El dinero será reintegrado al método de pago original. Esta acción no se puede deshacer.
            </p>
            {refundError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 mb-4">{refundError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                disabled={refunding}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRefund}
                disabled={refunding}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {refunding ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Procesando...
                  </>
                ) : "Devolver pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
