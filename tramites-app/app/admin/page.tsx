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
  user: { name: string; email: string }
  monto: number
  createdAt: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (session?.user?.role !== "admin") {
      router.push("/")
      return
    }

    // Cargar todos los trámites
    fetch("/api/admin/tramites")
      .then((res) => res.json())
      .then((data) => {
        setTramites(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error(error)
        setLoading(false)
      })
  }, [status, session, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
          <Link href="/api/auth/signout" className="text-red-600 hover:text-red-800">
            Salir
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Usuario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Oficina</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Trámite</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Monto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tramites.map((tramite) => (
                <tr key={tramite.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <p className="font-semibold">{tramite.user.name}</p>
                      <p className="text-gray-600">{tramite.user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{tramite.oficina}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{tramite.tipoTramite}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        tramite.estado === "completado"
                          ? "bg-green-100 text-green-800"
                          : tramite.estado === "en_proceso"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {tramite.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">${tramite.monto.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/tramites/${tramite.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Ver detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
