"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

const TRAMITES = [
  { id: "inscripcion", nombre: "Inscripción de Propiedad", monto: 1500 },
  { id: "transferencia", nombre: "Transferencia de Dominio", monto: 2500 },
  { id: "actualizacion", nombre: "Actualización de Datos", monto: 800 },
  { id: "certificado", nombre: "Certificado de Propiedad", monto: 500 },
]

export default function RegistroPropiedad() {
  const { status } = useSession()
  const router = useRouter()
  const [selectedTramite, setSelectedTramite] = useState("")
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState("")

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const tramiteSeleccionado = TRAMITES.find((t) => t.id === selectedTramite)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTramite) return

    setLoading(true)

    try {
      const res = await fetch("/api/tramites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oficina: "Registro Propiedad Inmueble",
          tipoTramite: tramiteSeleccionado!.nombre,
          descripcion: description,
          monto: tramiteSeleccionado!.monto,
        }),
      })

      if (!res.ok) throw new Error("Error al crear trámite")

      const tramite = await res.json()
      router.push(`/pago/${tramite.id}`)
    } catch (error) {
      console.error(error)
      alert("Error al crear el trámite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800">MisTrámites</span>
            </Link>
            <div className="w-16"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Registro Propiedad Inmueble</h1>
            <p className="text-gray-600 text-sm">Seleccioná el trámite que necesitás realizar</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de trámite</label>
              <select
                value={selectedTramite}
                onChange={(e) => setSelectedTramite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Seleccionar...</option>
                {TRAMITES.map((tramite) => (
                  <option key={tramite.id} value={tramite.id}>
                    {tramite.nombre} - ${tramite.monto.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Detalles adicionales sobre tu solicitud..."
              />
            </div>

            {tramiteSeleccionado && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monto a pagar:</span>
                  <span className="text-xl font-semibold text-gray-900">
                    ${tramiteSeleccionado.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedTramite || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Procesando..." : "Continuar al pago"}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-sm">
            © 2024 MisTrámites - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
