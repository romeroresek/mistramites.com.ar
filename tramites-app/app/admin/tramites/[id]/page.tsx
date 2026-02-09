"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

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
  user: { name: string; email: string }
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
    new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })

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
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800 hidden sm:inline">MisTrámites</span>
            </Link>
            <Link href="/api/auth/signout" className="text-red-600 hover:text-red-800 text-xs sm:text-sm">
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
              <span className="text-gray-500">Oficina:</span>
              <p className="font-medium text-gray-900">{tramite.oficina}</p>
            </div>
            <div>
              <span className="text-gray-500">Usuario:</span>
              <p className="font-medium text-gray-900">{tramite.user.name}</p>
              <p className="text-gray-500 text-xs">{tramite.user.email}</p>
            </div>
            <div>
              <span className="text-gray-500">Monto:</span>
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
              <span className="text-gray-500">Pago:</span>
              <div className="mt-1">
                <select
                  value={tramite.pago?.estado || "pendiente"}
                  onChange={(e) => handlePagoEstadoChange(e.target.value)}
                  disabled={updating}
                  className={`px-2 py-1 rounded text-xs font-medium border ${
                    tramite.pago?.estado === "confirmado"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-yellow-100 text-yellow-700 border-yellow-300"
                  }`}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Pagado</option>
                </select>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Creado:</span>
              <p className="font-medium text-gray-900">{formatDate(tramite.createdAt)}</p>
            </div>
            <div>
              <span className="text-gray-500">Actualizado:</span>
              <p className="font-medium text-gray-900">{formatDate(tramite.updatedAt)}</p>
            </div>
          </div>

          {tramite.descripcion && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-gray-500 text-sm">Descripción:</span>
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
            <h3 className="text-base font-semibold text-gray-900 mb-3">Datos de la partida</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">DNI:</span>
                <p className="font-medium text-gray-900">{tramite.partida.dni}</p>
              </div>
              <div>
                <span className="text-gray-500">Sexo:</span>
                <p className="font-medium text-gray-900">{tramite.partida.sexo === "M" ? "Masculino" : "Femenino"}</p>
              </div>
              <div>
                <span className="text-gray-500">Apellido:</span>
                <p className="font-medium text-gray-900">{tramite.partida.apellido}</p>
              </div>
              <div>
                <span className="text-gray-500">Nombres:</span>
                <p className="font-medium text-gray-900">{tramite.partida.nombres}</p>
              </div>
              <div>
                <span className="text-gray-500">Fecha de nacimiento:</span>
                <p className="font-medium text-gray-900">{formatDate(tramite.partida.fechaNacimiento)}</p>
              </div>
              {tramite.partida.ciudadNacimiento && (
                <div>
                  <span className="text-gray-500">Ciudad:</span>
                  <p className="font-medium text-gray-900">{tramite.partida.ciudadNacimiento}</p>
                </div>
              )}
              {tramite.partida.fechaDefuncion && (
                <div>
                  <span className="text-gray-500">Fecha de defunción:</span>
                  <p className="font-medium text-gray-900">{formatDate(tramite.partida.fechaDefuncion)}</p>
                </div>
              )}
            </div>

            {/* Persona 2 (matrimonio) */}
            {tramite.partida.tipoPartida === "matrimonio" && tramite.partida.dni2 && (
              <>
                <hr className="my-4 border-gray-200" />
                <h4 className="font-medium text-gray-900 mb-3 text-sm">Segunda persona</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">DNI:</span>
                    <p className="font-medium text-gray-900">{tramite.partida.dni2}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sexo:</span>
                    <p className="font-medium text-gray-900">{tramite.partida.sexo2 === "M" ? "Masculino" : "Femenino"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Apellido:</span>
                    <p className="font-medium text-gray-900">{tramite.partida.apellido2}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Nombres:</span>
                    <p className="font-medium text-gray-900">{tramite.partida.nombres2}</p>
                  </div>
                  {tramite.partida.fechaNacimiento2 && (
                    <div>
                      <span className="text-gray-500">Fecha de nacimiento:</span>
                      <p className="font-medium text-gray-900">{formatDate(tramite.partida.fechaNacimiento2)}</p>
                    </div>
                  )}
                </div>

                <hr className="my-4 border-gray-200" />
                <h4 className="font-medium text-gray-900 mb-3 text-sm">Datos del matrimonio</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {tramite.partida.fechaMatrimonio && (
                    <div>
                      <span className="text-gray-500">Fecha de matrimonio:</span>
                      <p className="font-medium text-gray-900">{formatDate(tramite.partida.fechaMatrimonio)}</p>
                    </div>
                  )}
                  {tramite.partida.ciudadMatrimonio && (
                    <div>
                      <span className="text-gray-500">Ciudad:</span>
                      <p className="font-medium text-gray-900">{tramite.partida.ciudadMatrimonio}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Divorciados:</span>
                    <p className="font-medium text-gray-900">{tramite.partida.divorciados ? "Sí" : "No"}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

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
            © 2024 MisTrámites - Todos los derechos reservados
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
