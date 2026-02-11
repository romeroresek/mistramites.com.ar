"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { generateWhatsAppLink } from "@/lib/contactTemplates"

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
  }
}

const estadoOptions = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "completado", label: "Completado" },
  { value: "rechazado", label: "Rechazado" },
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
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [copiedEmail, setCopiedEmail] = useState(false)

  const fetchTramite = async () => {
    try {
      const res = await fetch(`/api/admin/tramites/${params.id}`)
      if (!res.ok) throw new Error("No encontrado")
      const data = await res.json()
      setTramite(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
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

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.push("/login"); return }
    if (session?.user?.role !== "admin") { router.push("/"); return }

    fetchTramite().then(() => {
      fetch("/api/mercadopago/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tramiteId: params.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.pagoEstado === "confirmado") fetchTramite()
        })
        .catch(() => {})
    })

    fetchPlantillas()
  }, [status, session, router, params.id])

  // Generar mensaje reemplazando placeholders
  const generarMensaje = (plantillaClave: string): string => {
    const plantilla = plantillas.find(p => p.clave === plantillaClave)
    if (!plantilla || !tramite) return ""

    const nombre = tramite.partida?.nombres || tramite.user?.name || "Usuario"
    const tipo = tramite.tipoTramite
    const monto = tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })

    return plantilla.mensaje
      .replace(/\{nombre\}/g, nombre)
      .replace(/\{tipo\}/g, tipo)
      .replace(/\{monto\}/g, monto)
  }

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
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="text-xs sm:text-sm">Volver</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icon.png" alt="TramitesMisiones" width={32} height={32} className="w-8 h-8" />
              <span className="font-semibold text-gray-800 hidden sm:inline">TramitesMisiones</span>
            </Link>
            <Link href="/api/auth/signout?callbackUrl=/" className="text-red-600 hover:text-red-800 text-xs sm:text-sm">
              Salir
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4">
        <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Detalle del trámite</h1>

        {/* Info general */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{tramite.tipoTramite}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Oficina</span>
              <p className="font-medium text-gray-900">{tramite.oficina}</p>
            </div>
            <div>
              <span className="text-gray-500">Usuario</span>
              <p className="font-medium text-gray-900">{tramite.user?.name || "Invitado"}</p>
              <p className="text-gray-500 text-xs">{tramite.user?.email || tramite.guestEmail}</p>
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
            <div className="sm:col-span-2">
              <span className="text-gray-500">Pago</span>
              <div className="mt-1 relative inline-block">
                <button
                  onClick={() => setShowPagoDropdown(!showPagoDropdown)}
                  disabled={updating}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 ${
                    tramite.pago?.estado === "confirmado"
                      ? "bg-green-500 text-white"
                      : tramite.pago?.estado === "devuelto"
                      ? "bg-gray-500 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {tramite.pago?.estado === "confirmado" ? "Pagado" : tramite.pago?.estado === "devuelto" ? "Cobro devuelto" : "Pendiente"}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
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
                      Cobro devuelto
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
        </div>

        {/* Estado del trámite */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Estado del trámite</h3>
          <div className="flex flex-wrap gap-2">
            {estadoOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleEstadoChange(opt.value)}
                disabled={updating || tramite.estado === opt.value}
                className={`px-3 py-1.5 rounded text-xs font-medium ${
                  tramite.estado === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } disabled:cursor-not-allowed`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Archivo PDF */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Documento PDF</h3>

          {tramite.archivoUrl ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1zm0 2h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1zm0 2h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1z"/>
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
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
          <h3 className="text-base font-semibold text-gray-900 mb-4">Contacto</h3>

          {/* Datos de contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-gray-500 text-sm">Email</span>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-medium text-gray-900 text-sm">
                  {tramite.user?.email || tramite.guestEmail || "No disponible"}
                </p>
                {(tramite.user?.email || tramite.guestEmail) && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tramite.user?.email || tramite.guestEmail || "")
                      setCopiedEmail(true)
                      setTimeout(() => setCopiedEmail(false), 2000)
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Copiar email"
                  >
                    {copiedEmail ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
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

          {/* Selector de plantilla y envío */}
          {(tramite.whatsapp || tramite.partida?.whatsapp) && plantillas.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-500 text-sm">Plantilla de mensaje</label>
                  <Link
                    href="/admin/plantillas"
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Editar plantillas"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Link>
                </div>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  {plantillas.map((p) => (
                    <option key={p.clave} value={p.clave}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Preview del mensaje */}
              <div className="mb-4">
                <label className="text-gray-500 text-sm block mb-1">Vista previa</label>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700">
                  {generarMensaje(selectedTemplate)}
                </div>
              </div>

              {/* Botón de envío */}
              <a
                href={generateWhatsAppLink(
                  (tramite.whatsapp || tramite.partida?.whatsapp)!,
                  generarMensaje(selectedTemplate)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar por WhatsApp
              </a>
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © 2024 TramitesMisiones - Todos los derechos reservados
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
    </div>
  )
}
