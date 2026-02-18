"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Home, FileText, LogOut } from "lucide-react"

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
    paymentId: string | null
    payerEmail: string | null
    payerName: string | null
    payerDni: string | null
    paymentMethod: string | null
    paymentDate: string | null
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch/verify solo al montar o cambiar sesión
  }, [status, session, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-14 items-center justify-between gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 min-h-[44px] shrink-0 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Volver</span>
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
            href="/api/auth/signout?callbackUrl=/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg min-h-[44px] flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Salir
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Panel de Administrador</h1>
          <div className="flex gap-2">
            <Link
              href="/admin/plantillas"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100"
            >
              Plantillas
            </Link>
            <Link
              href="/admin/usuarios"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100"
            >
              Usuarios
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
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-medium text-gray-900 text-sm truncate">{tramite.tipoTramite}</p>
                  <p className="text-sm text-gray-500 truncate">{tramite.user?.name ?? "Invitado"}</p>
                  <p className="text-sm text-gray-400 truncate">{tramite.user?.email ?? tramite.guestEmail}</p>
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
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-500">{tramite.oficina}</span>
                <span className="font-semibold text-gray-900">
                  ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-sm text-gray-400 mb-2">
                {new Date(tramite.createdAt).toLocaleDateString("es-AR")} {new Date(tramite.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </div>
              {tramite.pago?.payerEmail && (
                <div className="text-sm bg-blue-50 rounded-lg p-3 mb-2">
                  <div className="font-medium text-blue-800">Pagador MP:</div>
                  <div className="text-blue-600">{tramite.pago.payerName || "-"}</div>
                  <div className="text-blue-500">{tramite.pago.payerEmail}</div>
                  {tramite.pago.payerDni && <div className="text-blue-400">DNI: {tramite.pago.payerDni}</div>}
                  {tramite.pago.paymentId && <div className="text-blue-400">ID: {tramite.pago.paymentId}</div>}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <Link
                  href={`/admin/tramites/${tramite.id}`}
                  className="min-h-[44px] inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                >
                  Editar
                </Link>
                <button
                  onClick={() => setDeleteId(tramite.id)}
                  className="min-h-[44px] inline-flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                >
                  Eliminar
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
                    <span className={`px-2 py-1 rounded text-xs ${
                      tramite.pago?.estado === "confirmado"
                        ? "bg-green-100 text-green-700"
                        : tramite.pago?.estado === "devuelto"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {tramite.pago?.estado === "confirmado" ? "Pagado" : tramite.pago?.estado === "devuelto" ? "Devuelto" : "Pendiente"}
                    </span>
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
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
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
            © 2024 Trámites Misiones - Todos los derechos reservados
          </p>
        </div>
      </footer>

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
