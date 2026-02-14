"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface Usuario {
  id: string
  email: string
  name: string
}

const oficinas = [
  { id: "Registro de las Personas", tipos: ["Partida de Nacimiento", "Partida de Matrimonio", "Partida de Defunción"] },
  { id: "Registro de la Propiedad", tipos: ["Informe de Dominio", "Informe de Inhibición", "Certificado de Dominio"] },
  { id: "Apostillas", tipos: ["Apostilla de Partida", "Apostilla de Título", "Apostilla de Documento"] },
  { id: "Catastro", tipos: ["Informe Catastral", "Valuación Fiscal", "Plano de Mensura"] },
]

export default function NuevoTramite() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const [userId, setUserId] = useState("")
  const [oficina, setOficina] = useState("")
  const [tipoTramite, setTipoTramite] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("20000")
  const [estado, setEstado] = useState("pendiente")
  const [pagoEstado, setPagoEstado] = useState("pendiente")
  const [menuOpen, setMenuOpen] = useState(false)

  const tiposDisponibles = oficinas.find(o => o.id === oficina)?.tipos || []

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.push("/login"); return }
    if (session?.user?.role !== "admin") { router.push("/"); return }

    fetch("/api/admin/usuarios")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsuarios(data)
      })
      .finally(() => setLoading(false))
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError("")

    try {
      const res = await fetch("/api/admin/tramites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          oficina,
          tipoTramite,
          descripcion,
          monto: parseFloat(monto),
          estado,
          pagoEstado,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al crear trámite")
        return
      }

      router.push(`/admin/tramites/${data.id}`)
    } catch {
      setError("Error al crear trámite")
    } finally {
      setCreating(false)
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
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icon-192x192.png" alt="TramitesMisiones" width={32} height={32} className="w-8 h-8" />
              <span className="font-semibold text-gray-800">TramitesMisiones</span>
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
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
            href="/api/auth/signout?callbackUrl=/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Salir
          </Link>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-6">Cargar nuevo trámite</h1>

        <div className="bg-white border border-gray-200 rounded p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar usuario</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Oficina */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oficina</label>
              <select
                value={oficina}
                onChange={(e) => { setOficina(e.target.value); setTipoTramite("") }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar oficina</option>
                {oficinas.map((o) => (
                  <option key={o.id} value={o.id}>{o.id}</option>
                ))}
              </select>
            </div>

            {/* Tipo de trámite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de trámite</label>
              <select
                value={tipoTramite}
                onChange={(e) => setTipoTramite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                disabled={!oficina}
              >
                <option value="">Seleccionar tipo</option>
                {tiposDisponibles.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                placeholder="Detalles adicionales del trámite..."
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
              />
            </div>

            {/* Estado del trámite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado del trámite</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="completado">Completado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>

            {/* Estado del pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado del pago</label>
              <select
                value={pagoEstado}
                onChange={(e) => setPagoEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Pagado</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/admin"
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creando..." : "Crear trámite"}
              </button>
            </div>
          </form>
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
    </div>
  )
}
