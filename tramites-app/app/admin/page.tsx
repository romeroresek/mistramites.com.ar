"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  user: { name: string; email: string } | null
  guestEmail: string | null
  monto: number
  createdAt: string
  pago?: {
    estado: string
    mercadopagoId: string | null
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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

    fetchTramites().then((data) => verifyPendingPayments(data))
  }, [status, session, router])

  if (loading) {
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
              <Image src="/icon.png" alt="TramitesMisiones" width={32} height={32} className="w-8 h-8" />
              <span className="font-semibold text-gray-800 hidden sm:inline">TramitesMisiones</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">
                Inicio
              </Link>
              <Link href="/mis-tramites" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">
                Mis Trámites
              </Link>
              <Link href="/api/auth/signout" className="text-red-600 hover:text-red-800 text-xs sm:text-sm">
                Salir
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Panel de Administrador</h1>
          <div className="flex gap-2">
            <Link
              href="/admin/usuarios"
              className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Usuarios
            </Link>
            <Link
              href="/admin/tramites/nuevo"
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Nuevo trámite
            </Link>
          </div>
        </div>

        {/* Empty State */}
        {tramites.length === 0 && (
          <div className="bg-white border border-gray-200 rounded p-8 text-center">
            <p className="text-gray-500">No hay trámites registrados.</p>
          </div>
        )}

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {tramites.map((tramite) => (
            <div key={tramite.id} className="bg-white border border-gray-200 rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-medium text-gray-900 text-sm truncate">{tramite.tipoTramite}</p>
                  <p className="text-xs text-gray-500 truncate">{tramite.user?.name ?? "Invitado"}</p>
                  <p className="text-xs text-gray-400 truncate">{tramite.user?.email ?? tramite.guestEmail}</p>
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
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-gray-500">{tramite.oficina}</span>
                <span className="font-semibold text-gray-900">
                  ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {new Date(tramite.createdAt).toLocaleDateString("es-AR")} {new Date(tramite.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <Link
                  href={`/admin/tramites/${tramite.id}`}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Editar
                </Link>
                <button
                  onClick={() => setDeleteId(tramite.id)}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white border border-gray-200 rounded overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Usuario</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Oficina</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Trámite</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pago</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Estado</th>
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
                      <span className="text-gray-500 ml-2 text-xs">{tramite.user?.email ?? tramite.guestEmail}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{tramite.oficina}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{tramite.tipoTramite}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(tramite.createdAt).toLocaleDateString("es-AR")} {new Date(tramite.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {tramite.pago?.estado === "confirmado" ? "Pagado" : tramite.pago?.estado === "devuelto" ? "Devuelto" : "Pendiente"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {getEstadoLabel(tramite.estado)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © 2024 TramitesMisiones - Todos los derechos reservados
          </p>
        </div>
      </footer>

      {/* Modal de confirmación de eliminación */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded p-6 max-w-md w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este trámite? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
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
