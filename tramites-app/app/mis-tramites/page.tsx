"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  monto: number
  createdAt: string
  pago?: {
    estado: string
  }
}

export default function MisTramites() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetch("/api/tramites")
        .then((res) => res.json())
        .then((data) => {
          setTramites(data)
          setLoading(false)
        })
        .catch((error) => {
          console.error(error)
          setLoading(false)
        })
    }
  }, [status, router])

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Mis Trámites</h1>
          <div className="flex gap-4">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800">
              Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {tramites.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-600 mb-4">No tienes trámites registrados</p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
            >
              Crear un trámite
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {tramites.map((tramite) => (
              <div key={tramite.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{tramite.tipoTramite}</h3>
                    <p className="text-gray-600">{tramite.oficina}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        tramite.estado === "completado"
                          ? "bg-green-100 text-green-800"
                          : tramite.estado === "en_proceso"
                          ? "bg-blue-100 text-blue-800"
                          : tramite.estado === "rechazado"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {tramite.estado}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Monto</p>
                    <p className="text-lg font-bold text-gray-900">${tramite.monto.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pago</p>
                    <p className={`text-lg font-bold ${tramite.pago?.estado === "confirmado" ? "text-green-600" : "text-yellow-600"}`}>
                      {tramite.pago?.estado === "confirmado" ? "✓ Pagado" : "Pendiente"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  Creado: {new Date(tramite.createdAt).toLocaleDateString("es-AR")}
                </div>

                <Link
                  href={`/mis-tramites/${tramite.id}`}
                  className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Ver detalles
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
