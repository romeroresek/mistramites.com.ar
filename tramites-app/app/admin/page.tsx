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

  const fetchTramites = async () => {
    try {
      const res = await fetch("/api/admin/tramites")
      const data = await res.json()
      setTramites(data)
      return data
    } catch (error) {
      console.error(error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const verifyPendingPayments = async (tramitesList: Tramite[]) => {
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
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
          </div>
          <Link href="/api/auth/signout" className="text-red-600 hover:text-red-800">
            Salir
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Usuario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Oficina</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Trámite</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pago</th>
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
                        tramite.pago?.estado === "confirmado"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {tramite.pago?.estado === "confirmado" ? "Pagado" : "Pago pendiente"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                      {tramite.estado === "completado" ? "Completado"
                        : tramite.estado === "en_proceso" ? "En proceso"
                        : tramite.estado === "rechazado" ? "Rechazado"
                        : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                    ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </td>
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
