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
  const { data: session, status } = useSession()
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

      // Redirigir a pago
      router.push(`/pago/${tramite.id}`)
    } catch (error) {
      console.error(error)
      alert("Error al crear el trámite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
            ← Volver
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Registro Propiedad Inmueble</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">Selecciona el tipo de trámite:</label>
            <div className="grid gap-3">
              {TRAMITES.map((tramite) => (
                <label key={tramite.id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="tramite"
                    value={tramite.id}
                    checked={selectedTramite === tramite.id}
                    onChange={(e) => setSelectedTramite(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-900">{tramite.nombre}</p>
                    <p className="text-gray-600">${tramite.monto.toFixed(2)}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción (opcional):</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              rows={4}
              placeholder="Agrega detalles sobre tu solicitud..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-8">
            <p className="text-sm text-gray-700">
              <strong>Monto a pagar:</strong> {tramiteSeleccionado ? `$${tramiteSeleccionado.monto.toFixed(2)}` : "Selecciona un trámite"}
            </p>
          </div>

          <button
            type="submit"
            disabled={!selectedTramite || loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "Procesando..." : "Continuar al pago"}
          </button>
        </form>
      </main>
    </div>
  )
}
